import { Router } from 'express';
import { pool } from '../db';
import { logger } from '../utils/logger';
import { config } from '../config';

export const eventsRouter = Router();

type Client = { 
  id: number; 
  res: any; 
  sellerId: string;
  heartbeat: NodeJS.Timeout;
  lastActivity: number;
};

const clients: Client[] = [];
let nextClientId = 1;

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const CLIENT_TIMEOUT = 60000; // 60 seconds

function removeClient(client: Client) {
  const idx = clients.findIndex((c) => c.id === client.id);
  if (idx >= 0) {
    clearInterval(client.heartbeat);
    clients.splice(idx, 1);
    logger.info(`SSE client ${client.id} removed. Active clients: ${clients.length}`);
  }
}

function setupHeartbeat(client: Client) {
  // Clear any existing heartbeat
  if (client.heartbeat) {
    clearInterval(client.heartbeat);
  }

  // Setup new heartbeat
  client.heartbeat = setInterval(() => {
    try {
      if (Date.now() - client.lastActivity > CLIENT_TIMEOUT) {
        logger.warn(`Client ${client.id} timed out. Last activity: ${new Date(client.lastActivity).toISOString()}`);
        removeClient(client);
        return;
      }

      // Send a ping event instead of empty comment
      client.res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      client.lastActivity = Date.now();
    } catch (error: any) {
      if (error.code === 'ECONNRESET') {
        logger.info(`Client ${client.id} connection reset, cleaning up`);
      } else {
        logger.error('Heartbeat failed for client', { clientId: client.id, error });
      }
      removeClient(client);
    }
  }, HEARTBEAT_INTERVAL);
}

eventsRouter.get('/stream', (req, res) => {
  // Get seller ID from header or query parameter
  const sellerId = (req.header('x-seller-id') as string) || req.query.seller_id as string || 'demo-seller';
  
  logger.info(`New SSE connection request for seller: ${sellerId}`);

  // Disable request timeout
  req.socket.setTimeout(0);
  
  // Set proper SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': config.CORS_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'x-seller-id',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    'Content-Encoding': 'none', // Ensure compression is disabled
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Ensure the response socket won't timeout
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  req.socket.setTimeout(0);

  const id = nextClientId++;
  const client: Client = { 
    id, 
    res, 
    sellerId,
    heartbeat: null as unknown as NodeJS.Timeout,
    lastActivity: Date.now()
  };

  // Set up keep-alive interval
  setupHeartbeat(client);
  
  // Add client to active clients
  clients.push(client);

  // Send initial connection event
  const connectionEvent = {
    type: 'Connected',
    timestamp: new Date().toISOString(),
    sellerId,
    message: 'SSE connection established'
  };

  try {
    res.write(`data: ${JSON.stringify(connectionEvent)}\n\n`);
    client.lastActivity = Date.now();
  } catch (error) {
    logger.error('Error sending initial connection event', { clientId: id, error });
    removeClient(client);
    return;
  }

  // Handle client disconnect
  req.on('close', () => {
    logger.info(`SSE client ${id} disconnected`);
    removeClient(client);
  });

  req.on('error', (error) => {
    logger.error('SSE connection error:', { clientId: id, error });
    removeClient(client);
  });

  // Keep connection alive on the proxy side
  req.socket.setKeepAlive(true);
  req.socket.setTimeout(0);

  logger.info(`SSE client ${id} connected for seller ${sellerId}. Active clients: ${clients.length}`);
});

let pgClient: any = null;

export async function registerEventBroadcaster() {
  // Clean up existing connection if any
  if (pgClient) {
    try {
      await pgClient.query('unlisten events_channel');
      pgClient.release();
    } catch (error) {
      logger.error('Error cleaning up existing PostgreSQL connection:', error);
    }
  }

  pgClient = await pool.connect();
  
  try {
    await pgClient.query('listen events_channel');
    logger.info('SSE event broadcaster registered');

    pgClient.on('notification', async (msg: { payload?: string }) => {
      try {
        logger.info('Received database notification:', { payload: msg.payload });
        
        const payload = JSON.parse(msg.payload || '{}');
        const targetSeller = payload.seller_id as string;
        
        // Log the complete event data
        logger.info(`Processing notification:`, { 
          type: payload.type,
          seller: targetSeller,
          productId: payload.product_id,
          eventData: payload 
        });
        
        const deadClients: Client[] = [];
        let sentCount = 0;
        
        // Find relevant clients
        const targetClients = clients.filter(c => c.sellerId === targetSeller);
        logger.info(`Found ${targetClients.length} clients for seller ${targetSeller}`);
        
        for (const c of targetClients) {
          try {
            if (payload.type === 'LowStockWarning') {
              // Ensure the event name is included
              const eventName = payload.event || payload.type;
              
              // Format the message with proper event name
              // Format product data for the frontend
              const productData = {
                type: 'LowStockWarning',
                timestamp: new Date().toISOString(),
                product: {
                  id: payload.product_id,
                  name: payload.payload.name,
                  price: payload.payload.price,
                  quantity: payload.payload.current_quantity,
                  category: payload.payload.category
                }
              };

              const eventMessage = 
                `event: ${eventName}\n` +
                `data: ${JSON.stringify(productData)}\n\n`;

              c.res.write(eventMessage);
              c.lastActivity = Date.now();
              sentCount++;

              logger.info(`Sent low stock warning to client ${c.id}`, {
                event: eventName,
                productId: payload.product_id,
                productName: payload.payload?.name,
                quantity: payload.payload?.current_quantity,
                message: eventMessage
              });
            } else {
              // For other events, keep the original event type
              const eventMessage = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
              c.res.write(eventMessage);
              c.lastActivity = Date.now();
              sentCount++;
              
              logger.info(`Sent ${payload.type} event to client ${c.id}`, {
                message: eventMessage
              });
            }
          } catch (error) {
            logger.error('Error writing to SSE client:', { 
              clientId: c.id,
              error,
              eventType: payload.type
            });
            deadClients.push(c);
          }
        }

        // Log summary
        logger.info(`Event broadcast complete. Sent to ${sentCount} clients, found ${deadClients.length} dead clients`);

        // Clean up dead clients
        deadClients.forEach(removeClient);
      } catch (error) {
        logger.error('Error processing SSE notification:', error);
      }
    });

    pgClient.on('error', (error: Error) => {
      logger.error('PostgreSQL notification error:', error);
      // Attempt to reconnect
      setTimeout(() => registerEventBroadcaster(), 5000);
    });

  } catch (error) {
    logger.error('Error setting up event broadcaster:', error);
    pgClient.release();
    // Attempt to reconnect
    setTimeout(() => registerEventBroadcaster(), 5000);
  }
}