export type Product = {
  id: number;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  created_at: string;
  updated_at: string;
};

export type EventRecord = {
  id: number;
  type: 'ProductCreated' | 'ProductUpdated' | 'ProductDeleted' | 'LowStockWarning';
  seller_id: string;
  product_id?: number;
  payload: unknown;
  created_at: string;
};


