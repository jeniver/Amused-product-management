// Event contract schemas for the AMused system
// Generated from AI-assisted architecture design

export interface BaseEvent {
  type: string;
  sellerId: string;
  timestamp: string;
  eventId: string;
}

export interface ProductCreatedEvent extends BaseEvent {
  type: 'ProductCreated';
  productId: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    category: string;
  };
}

export interface ProductUpdatedEvent extends BaseEvent {
  type: 'ProductUpdated';
  productId: number;
  changes: {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    category?: string;
  };
  previousValues: {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    category?: string;
  };
}

export interface ProductDeletedEvent extends BaseEvent {
  type: 'ProductDeleted';
  productId: number;
  productName: string;
}

export interface LowStockWarningEvent extends BaseEvent {
  type: 'LowStockWarning';
  productId: number;
  productName: string;
  currentQuantity: number;
  threshold: number;
  severity: 'low' | 'critical';
}

export interface AIRecommendationEvent extends BaseEvent {
  type: 'AIRecommendation';
  productId: number;
  recommendations: {
    productId: number;
    name: string;
    confidence: number;
    reason: string;
  }[];
}

export interface SystemHealthEvent extends BaseEvent {
  type: 'SystemHealth';
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
    databaseConnections: number;
  };
}

// Union type for all events
export type SystemEvent = 
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | ProductDeletedEvent
  | LowStockWarningEvent
  | AIRecommendationEvent
  | SystemHealthEvent;

// Event payload for database storage
export interface EventPayload {
  event: SystemEvent;
  metadata: {
    source: 'api' | 'system' | 'ai';
    version: string;
    correlationId?: string;
  };
}

// Event filter for SSE clients
export interface EventFilter {
  types?: string[];
  sellerId?: string;
  productId?: number;
  since?: string;
}

// Event subscription for SSE
export interface EventSubscription {
  id: string;
  sellerId: string;
  filter: EventFilter;
  createdAt: string;
  lastEventId?: string;
}
