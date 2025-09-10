import { pool } from "../db";
import { logger } from "../utils/logger";
import { redisCache } from "../config/redis";
import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callChatJson<T = any>(
  prompt: string,
  system: string,
  opts: { model?: string; timeoutMs?: number; maxRetries?: number } = {}
): Promise<{ success: boolean; parsed?: T; raw?: string; error?: any }> {
  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const maxRetries = opts.maxRetries ?? 1;
  const timeoutMs = opts.timeoutMs ?? 10000;

  let lastErr: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await Promise.race([
        openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("OpenAI timeout")), timeoutMs)
        ),
      ]);

      const raw = (resp as any).choices?.[0]?.message?.content;
      if (!raw) throw new Error("Empty response");

      const jsonText = extractJson(raw);
      if (!jsonText) throw new Error("No JSON found in output");

      const parsed = JSON.parse(jsonText);
      return { success: true, parsed, raw };
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  return { success: false, error: lastErr };
}

function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0,
    inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && text[i - 1] !== "\\") inString = !inString;
    if (!inString) {
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}



class TokenBucket {
  tokens: number;
  capacity: number;
  refillRate: number;
  lastRefill: number;

  constructor(capacity: number, refillPerMinute: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillPerMinute / 60;
    this.lastRefill = Date.now();
  }

  take(count = 1): boolean {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}

const aiRateLimiter = new TokenBucket(
  20,
  Number(process.env.AI_RPM || 20)
);

/* ------------------------------------------------------------------
   Interfaces
------------------------------------------------------------------- */

export interface StockPrediction {
  productId: number;
  currentStock: number;
  daysUntilStockOut: number;
  recommendedReorderQuantity: number;
  salesVelocity: number;
  confidence: number;
  aiRecommendation?: string;
}

export interface InventoryAnalytics {
  trends: ProductTrend[];
  summary: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averageStockLevel: number;
  };
  categoryBreakdown: CategoryStat[];
  analysisPeriod: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export interface ProductTrend {
  productId: number;
  name: string;
  category: string;
  currentStock: number;
  salesVelocity: number;
  reorderPoint: number;
  prediction: StockPrediction;
}

export interface CategoryStat {
  category: string;
  productCount: number;
  averageStock: number;
  lowStockCount: number;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  keywords: string[];
}

interface PriceOptimizationResult {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  competitivePriceRange: {
    min: number;
    max: number;
  };
}

interface ProductRecommendation {
  productId: number;
  name: string;
  similarity: number;
  reason: string;
}


class AIService {

  async getProductRecommendations(
    productId: number,
    sellerId: string
  ): Promise<ProductRecommendation[]> {
    try {
      // Use a longer cache key that includes more context for better cache differentiation
      const cacheKey = `recommendations:${productId}:${sellerId}:v2`;
      const cached = await redisCache.get<ProductRecommendation[]>(cacheKey);
      if (cached) {
        logger.debug('Product recommendations cache hit', { productId });
        return cached;
      }

      // Optimize query by selecting only necessary fields and using a single query with JOIN
      const { rows } = await pool.query(
        `WITH product AS (
          SELECT id, name, description, category, price 
          FROM products 
          WHERE id = $1
        )
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          p.category, 
          p.price,
          product.id as main_product_id,
          product.name as main_product_name,
          product.category as main_product_category,
          product.price as main_product_price
        FROM products p
        CROSS JOIN product
        WHERE p.category = product.category 
        AND p.id != product.id 
        AND p.seller_id = $2
        ORDER BY p.id
        LIMIT 5`,  // Reduced limit to decrease processing load
        [productId, sellerId]
      );

      if (rows.length === 0) return [];

      // Extract main product from the first row
      const product = rows.length > 0 ? {
        id: rows[0].main_product_id,
        name: rows[0].main_product_name,
        category: rows[0].main_product_category,
        description: rows[0].description,
        price: rows[0].main_product_price
      } : null;

      if (!product) return [];

      // Map similar products
      const similarProducts = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: row.price
      }));
      if (similarProducts.length === 0) return [];

      let recommendations: ProductRecommendation[] = [];

      if (process.env.OPENAI_API_KEY && aiRateLimiter.take()) {
        try {
          const prompt = `Analyze the following product and suggest similar items from the available candidates.
Main Product:
- Name: ${product.name}
- Category: ${product.category}
- Description: ${product.description || 'N/A'}
- Price: ${product.price}

Available Similar Products:
${similarProducts.map(p => `- ${p.name} (ID: ${p.id}), Price: ${p.price}`).join('\n')}

Return recommendations in the following JSON format:
{
  "recommendations": [
    {
      "productId": number,
      "similarity": number (0-1),
      "reason": "Clear explanation why this product is recommended"
    }
  ]
}

Focus on:
1. Product type and use case similarities
2. Price range compatibility
3. Complementary product features
4. Customer preference patterns`;

          const { success, parsed } = await callChatJson<{ recommendations: any[] }>(
            prompt,
            "You are a product recommendation expert focusing on customer satisfaction and relevant suggestions. Consider product features, price points, and use cases when making recommendations.",
            { timeoutMs: 15000 }  // Increased timeout for better responses
          );

          if (success && parsed?.recommendations) {
            recommendations = parsed.recommendations.map((r) => ({
              productId: r.productId,
              name: similarProducts.find((p: any) => p.id === r.productId)?.name || 'Unknown Product',
              similarity: r.similarity,
              reason: r.reason,
            }));

            // Cache successful AI recommendations for 30 minutes
            await redisCache.set(cacheKey, recommendations, 30 * 60 * 1000);
            return recommendations;
          }
        } catch (aiError) {
          logger.warn("AI recommendations failed, falling back to basic similarity", {
            productId,
            error: aiError
          });
        }
      }

      // Enhanced fallback logic with better similarity calculation
      recommendations = similarProducts.map((p: any) => ({
        productId: p.id,
        name: p.name,
        similarity: this.calculateEnhancedSimilarity(product, p),
        reason: this.generateFallbackReason(product, p),
      }));

      // Cache fallback recommendations for 10 minutes
      await redisCache.set(cacheKey, recommendations, 10 * 60 * 1000);
      return recommendations;

    } catch (err) {
      logger.error("Product recommendations failed", { err, productId });
      return [];
    }
  }

  private calculateEnhancedSimilarity(a: any, b: any): number {
    // Price similarity (30% weight)
    const priceDiff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
    const priceSimilarity = 1 - priceDiff;

    // Category match (40% weight)
    const categorySimilarity = a.category === b.category ? 1 : 0;

    // Name similarity (30% weight)
    const nameSimilarity = this.calculateNameSimilarity(a.name, b.name);

    return (
      priceSimilarity * 0.3 +
      categorySimilarity * 0.4 +
      nameSimilarity * 0.3
    );
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = new Set(name1.toLowerCase().split(/\W+/));
    const words2 = new Set(name2.toLowerCase().split(/\W+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private generateFallbackReason(product: any, similar: any): string {
    const reasons: string[] = [];

    if (product.category === similar.category) {
      reasons.push(`same category (${product.category})`);
    }

    const priceDiff = Math.abs(product.price - similar.price);
    const pricePercent = (priceDiff / product.price) * 100;
    if (pricePercent <= 20) {
      reasons.push("similar price range");
    } else if (similar.price < product.price) {
      reasons.push("more affordable option");
    } else {
      reasons.push("premium alternative");
    }

    const nameSimilarity = this.calculateNameSimilarity(product.name, similar.name);
    if (nameSimilarity > 0.3) {
      reasons.push("similar product type");
    }

    return `Suggested based on ${reasons.join(" and ")}`;
  }

  /* ------------ Pricing ------------ */
  async optimizePrice(
    productId: number,
    sellerId: string
  ): Promise<PriceOptimizationResult> {
    try {
      const { rows: [product] } = await pool.query(
        `SELECT p.*, 
         (SELECT AVG(price) FROM sales_history WHERE product_id=p.id) as avg_sale_price,
         (SELECT COUNT(*) FROM sales_history WHERE product_id=p.id) as total_sales
         FROM products p WHERE p.id=$1 AND p.seller_id=$2`,
        [productId, sellerId]
      );
      if (!product) throw new Error("Product not found");

      const { rows: [cat] } = await pool.query(
        `SELECT MIN(price) as min, MAX(price) as max, AVG(price) as avg
         FROM products WHERE category=$1 AND seller_id=$2`,
        [product.category, sellerId]
      );

      if (process.env.OPENAI_API_KEY && aiRateLimiter.take()) {
        const prompt = `Return JSON { "suggestedPrice":number,"confidence":0-1,"reasoning":string,"competitivePriceRange":{"min":number,"max":number}}.
Product:${JSON.stringify(product)} CategoryRange:${JSON.stringify(cat)}`;

        const { success, parsed } = await callChatJson<PriceOptimizationResult>(
          prompt,
          "You are a pricing strategy expert."
        );
        if (success && parsed) return parsed;
      }

      return {
        suggestedPrice: cat.avg,
        confidence: 0.5,
        reasoning: "Fallback: category average",
        competitivePriceRange: { min: cat.min, max: cat.max },
      };
    } catch (err) {
      logger.error("Price optimization failed", { err, productId });
      throw err;
    }
  }

  /* ------------ Description ------------ */
  async generateProductDescription(
    name: string,
    category: string
  ): Promise<string> {
    // Create a cache key based on normalized input to increase cache hits
    const normalizedName = name.toLowerCase().trim();
    const normalizedCategory = category.toLowerCase().trim();
    const cacheKey = `product:description:${Buffer.from(normalizedName.substring(0, 50)).toString('base64')}:${Buffer.from(normalizedCategory.substring(0, 30)).toString('base64')}`;

    // Check cache first
    const cached = await redisCache.get<string>(cacheKey);
    if (cached) {
      logger.debug('Product description cache hit', { name });
      return cached;
    }

    if (process.env.OPENAI_API_KEY && aiRateLimiter.take()) {
      const prompt = `Return product description under 200 words.`;
      const { success, parsed, raw } = await callChatJson<{ desc: string }>(
        `Return JSON { "desc":string } for product:${name}, category:${category}`,
        "You are an e-commerce copywriter."
      );

      if (success && parsed?.desc) {
        // Cache successful AI description for 7 days (product descriptions rarely change)
        await redisCache.set(cacheKey, parsed.desc, 7 * 24 * 60 * 60 * 1000);
        return parsed.desc;
      }

      if (raw) {
        // Cache raw response for 1 day
        await redisCache.set(cacheKey, raw, 24 * 60 * 60 * 1000);
        return raw;
      }
    }

    const fallbackDescription = `${name} - A quality product in ${category}.`;
    // Cache fallback for 1 hour
    await redisCache.set(cacheKey, fallbackDescription, 60 * 60 * 1000);
    return fallbackDescription;
  }

  /* ------------ Market Insights ------------ */
  async getMarketInsights(category: string): Promise<string> {
    if (process.env.OPENAI_API_KEY && aiRateLimiter.take()) {
      const { success, parsed, raw } = await callChatJson<{ insights: string }>(
        `Return JSON { "insights":string } with concise market insights for category:${category}`,
        "You are an e-commerce market research expert."
      );
      if (success && parsed?.insights) return parsed.insights;
      if (raw) return raw;
    }
    return `Market insights for ${category}: Consider competitive pricing and quality.`;
  }

  /* ------------ Predictions ------------ */
  private async getAIEnhancedPrediction(
    productId: number,
    stock: number,
    sales: { totalSold: number; days: number }
  ): Promise<{ confidence: number; recommendation: string } | null> {
    if (!process.env.OPENAI_API_KEY || !aiRateLimiter.take()) return null;

    const cacheKey = `pred:${productId}:${stock}:${sales.totalSold}:${sales.days}`;
    const cached = await redisCache.get<{ confidence: number; recommendation: string }>(cacheKey);
    if (cached) {
      logger.debug('Prediction cache hit', { productId });
      return cached;
    }

    const prompt = `Return JSON {"confidence":0-1,"recommendation":string}.
                    Stock:${stock} Sold:${sales.totalSold} Days:${sales.days}`;

    const { success, parsed } = await callChatJson<{
      confidence: number;
      recommendation: string;
    }>(prompt, "You are an inventory forecasting expert.");

    if (success && parsed) {
      await redisCache.set(cacheKey, parsed, 3600 * 1000);
      return parsed;
    }

    return {
      confidence: this.calculatePredictionConfidence(sales.totalSold, sales.days),
      recommendation: "Fallback prediction due to AI failure",
    };
  }


  async predictLowStock(
    productId: number,
    sellerId: string
  ): Promise<StockPrediction | null> {
    try {
      // Create a more specific cache key that includes seller information
      const predictionCacheKey = `prediction:detailed:${productId}:${sellerId}`;
      const cachedPrediction = await redisCache.get<StockPrediction>(predictionCacheKey);

      if (cachedPrediction) {
        logger.debug('Detailed prediction cache hit', { productId });
        return cachedPrediction;
      }

      // Optimize by combining queries into a single query with a CTE
      const { rows } = await pool.query(
        `WITH product_data AS (
          SELECT id, quantity 
          FROM products 
          WHERE id = $1 AND seller_id = $2
        ),
        sales_data AS (
          SELECT 
            SUM(quantity_sold) as total_sold,
            COUNT(DISTINCT date_trunc('day', sale_date)) as days
          FROM sales_history 
          WHERE product_id = $1 
          AND sale_date >= NOW() - INTERVAL '30 days'
        )
        SELECT 
          p.id, 
          p.quantity,
          COALESCE(s.total_sold, 0) as total_sold,
          COALESCE(s.days, 30) as days
        FROM product_data p
        LEFT JOIN sales_data s ON true`,
        [productId, sellerId]
      );

      if (rows.length === 0) return null;

      const product = rows[0];
      const totalSold = parseInt(product.total_sold || "0");
      const days = parseInt(product.days || "30");
      const velocity = days > 0 ? totalSold / days : 0;

      const daysOut = velocity > 0 ? Math.floor(product.quantity / velocity) : 999;
      const reorderQty = Math.ceil(velocity * 30);
      const baseConf = this.calculatePredictionConfidence(totalSold, days);

      const ai = await this.getAIEnhancedPrediction(product.id, product.quantity, {
        totalSold,
        days,
      });

      const prediction = {
        productId,
        currentStock: product.quantity,
        daysUntilStockOut: daysOut,
        recommendedReorderQuantity: reorderQty,
        salesVelocity: velocity,
        confidence: ai?.confidence || baseConf,
        aiRecommendation: ai?.recommendation,
      };

      // Cache the prediction for 1 hour
      await redisCache.set(predictionCacheKey, prediction, 60 * 60 * 1000);

      return prediction;
    } catch (err) {
      logger.error("Prediction failed", { err, productId });
      return null;
    }
  }

  /* ------------ Analytics ------------ */
  async getInventoryAnalytics(
    sellerId: string,
    days: number = 30
  ): Promise<InventoryAnalytics> {
    // Use a more specific cache key with version to allow for cache invalidation when needed
    const cacheKey = `inventory:analytics:v2:${sellerId}:${days}`;
    const cached = await redisCache.get<InventoryAnalytics>(cacheKey);
    if (cached) {
      logger.debug('Inventory analytics cache hit', { sellerId });
      return cached;
    }

    // Use a shorter cache for partial results to avoid redundant processing
    const partialCacheKey = `inventory:analytics:partial:${sellerId}:${days}`;
    const partialCached = await redisCache.get<any>(partialCacheKey);

    // Optimize query by using a CTE (Common Table Expression) to avoid repeated scans
    const { rows: [result] } = await pool.query(`
      WITH product_stats AS (
        SELECT 
          p.id,
          p.name,
          p.category,
          p.quantity,
          COALESCE(sh.total_sold, 0) as sold
        FROM products p
        LEFT JOIN (
          SELECT 
            product_id,
            SUM(quantity_sold) as total_sold
          FROM sales_history 
          WHERE sale_date >= NOW() - INTERVAL '${days} days'
          GROUP BY product_id
        ) sh ON p.id = sh.product_id
        WHERE p.seller_id = $1
      ),
      summary_stats AS (
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN quantity <= 5 THEN 1 END) as low,
          COUNT(CASE WHEN quantity = 0 THEN 1 END) as out,
          AVG(quantity) as avg
        FROM product_stats
      ),
      category_stats AS (
        SELECT 
          category,
          COUNT(*) as count,
          AVG(quantity) as avg,
          COUNT(CASE WHEN quantity <= 5 THEN 1 END) as low
        FROM product_stats
        GROUP BY category
      )
      SELECT 
        jsonb_build_object(
          'summary', (SELECT jsonb_build_object(
            'total', total,
            'low', low,
            'out', out,
            'avg', avg
          ) FROM summary_stats),
          'categories', (SELECT jsonb_agg(
            jsonb_build_object(
              'category', category,
              'productCount', count,
              'averageStock', avg,
              'lowStockCount', low
            )
          ) FROM category_stats),
          'products', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', id,
                'name', name,
                'category', category,
                'quantity', quantity,
                'sold', sold
              )
            )
            FROM (
              SELECT *
              FROM product_stats
              ORDER BY quantity ASC
              LIMIT 20
            ) top_products
          )
        ) as result
    `, [sellerId]);

    const { summary, categories, products = [] } = result.result || {};

    // Process predictions in parallel with batching
    const trendsPromises = (products || []).map(async (p: any) => {
      const salesVelocity = p.sold / days;
      const reorderPoint = Math.ceil(salesVelocity * 7);

      const cacheKey = `prediction:${p.id}:${p.quantity}:${p.sold}:${days}`;
      const cachedPred = await redisCache.get<StockPrediction>(cacheKey);

      const prediction = cachedPred || await this.predictLowStock(p.id, sellerId);

      return {
        productId: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.quantity,
        salesVelocity,
        reorderPoint,
        prediction: prediction || {
          productId: p.id,
          currentStock: p.quantity,
          daysUntilStockOut: 999,
          recommendedReorderQuantity: 0,
          salesVelocity: 0,
          confidence: 0,
        },
      };
    });

    // Process all predictions in parallel
    const trends = await Promise.all(trendsPromises);

    const analytics: InventoryAnalytics = {
      trends,
      summary: {
        totalProducts: parseInt(summary?.total || '0'),
        lowStockProducts: parseInt(summary?.low || '0'),
        outOfStockProducts: parseInt(summary?.out || '0'),
        averageStockLevel: parseFloat(summary?.avg || '0'),
      },
      categoryBreakdown: (categories || []).map((c: any) => ({
        category: c.category || 'Uncategorized',
        productCount: parseInt(c.productCount || '0'),
        averageStock: parseFloat(c.averageStock || '0'),
        lowStockCount: parseInt(c.lowStockCount || '0'),
      })),
      analysisPeriod: {
        days,
        startDate: new Date(Date.now() - days * 86400000).toISOString(),
        endDate: new Date().toISOString(),
      },
    };

    // Cache the partial result for 10 minutes to avoid redundant database queries
    await redisCache.set(partialCacheKey, { summary, categories, products }, 10 * 60 * 1000);

    // Cache the final result for 15 minutes (increased from 5 minutes)
    // This is a good balance between freshness and performance
    await redisCache.set(cacheKey, analytics, 15 * 60 * 1000);

    return analytics;
  }

  /* ------------ Categorization ------------ */
  async suggestCategory(name: string, description: string): Promise<CategorySuggestion> {
    // Create a cache key based on normalized input to increase cache hits
    const normalizedName = name.toLowerCase().trim();
    const normalizedDesc = description.toLowerCase().trim();
    const cacheKey = `category:suggestion:${Buffer.from(normalizedName.substring(0, 50)).toString('base64')}:${Buffer.from(normalizedDesc.substring(0, 50)).toString('base64')}`;

    // Check cache first
    const cached = await redisCache.get<CategorySuggestion>(cacheKey);
    if (cached) {
      logger.debug('Category suggestion cache hit', { name });
      return cached;
    }

    if (process.env.OPENAI_API_KEY && aiRateLimiter.take()) {
      const { success, parsed } = await callChatJson<CategorySuggestion>(
        `Return JSON {"category":string,"confidence":0-1,"keywords":[string]} for product:${name}, desc:${description}`,
        "You are a product categorization expert."
      );
      if (success && parsed) {
        // Cache successful AI categorization for 24 hours (categories rarely change)
        await redisCache.set(cacheKey, parsed, 24 * 60 * 60 * 1000);
        return parsed;
      }
    }

    // fallback rule-based
    const rules: Record<string, string[]> = {
      Electronics: ["device", "tech", "phone", "laptop"],
      Clothing: ["shirt", "dress", "wear", "jacket"],
      "Home & Garden": ["home", "kitchen", "garden", "furniture"],
      Sports: ["sport", "fitness", "gym"],
      Books: ["book", "novel", "literature"],
      Toys: ["toy", "game", "kids"],
    };

    const text = `${name} ${description}`.toLowerCase();
    let best: CategorySuggestion = { category: "Other", confidence: 0, keywords: [] };
    for (const [cat, kws] of Object.entries(rules)) {
      const hits = kws.filter((k) => text.includes(k));
      const conf = hits.length / kws.length;
      if (conf > best.confidence) best = { category: cat, confidence: conf, keywords: hits };
    }
    return best;
  }


  private calculatePredictionConfidence(total: number, days: number): number {
    if (days < 7) return 0.3;
    if (days < 14) return 0.6;
    if (total === 0) return 0.4;
    return Math.min(0.9, days / 30);
  }
}

export const aiService = new AIService();
