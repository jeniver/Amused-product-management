import { Pool, Client } from 'pg';
import { config } from './config';
import { logger } from './utils/logger';

export const pool = new Pool({
  ...config.DATABASE,
  max: config.DATABASE.max,
  idleTimeoutMillis: config.DATABASE.idleTimeoutMillis,
  connectionTimeoutMillis: 5000,
});

async function waitForDb(maxWaitMs = 60000, intervalMs = 1500) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const client = new Client(config.DATABASE);
    try {
      await client.connect();
      await client.query('select 1');
      await client.end();
      return; // connected
    } catch (err) {
      try { await client.end(); } catch { /* ignore */ }
      if (Date.now() - start > maxWaitMs) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

export async function initSchema() {
  await waitForDb();
  await pool.query(`
    create table if not exists products (
      id serial primary key,
      seller_id text not null,
      name text not null,
      description text not null,
      price numeric(12,2) not null,
      quantity integer not null,
      category text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists events (
      id bigserial primary key,
      type text not null,
      seller_id text not null,
      product_id integer,
      payload jsonb not null,
      created_at timestamptz not null default now()
    );

    -- AI recommendations cache
    create table if not exists ai_recommendations (
      id serial primary key,
      product_id integer references products(id),
      recommendations jsonb not null,
      expires_at timestamptz not null,
      created_at timestamptz default now(),
      unique(product_id)
    );

    -- AI predictions
    create table if not exists ai_predictions (
      id serial primary key,
      product_id integer references products(id),
      prediction_type varchar(50) not null,
      prediction_data jsonb not null,
      confidence_score decimal(3,2) not null,
      created_at timestamptz default now()
    );

    -- Sales history for predictions
    create table if not exists sales_history (
      id serial primary key,
      product_id integer references products(id),
      quantity_sold integer not null,
      sale_date date not null,
      price decimal(12,2) not null,
      created_at timestamptz default now()
    );

    create or replace function notify_event() returns trigger as $$
    declare
      last_similar_event events;
    begin
      -- Check for similar events in the last 5 seconds to prevent duplicates
      select * into last_similar_event
      from events
      where type = NEW.type 
        and product_id = NEW.product_id
        and id != NEW.id
        and created_at > (now() - interval '5 seconds')
      order by created_at desc
      limit 1;
      
      -- Only notify if no similar event was found
      if last_similar_event.id is null then
        perform pg_notify('events_channel', row_to_json(NEW)::text);
      end if;
      
      return NEW;
    end;
    $$ language plpgsql;

    drop trigger if exists events_notify_trigger on events;
    create trigger events_notify_trigger
    after insert on events
    for each row execute function notify_event();

    -- Insert sample sales history for demo purposes
    INSERT INTO sales_history (product_id, quantity_sold, sale_date, price)
    SELECT 
      p.id,
      FLOOR(RANDOM() * 5) + 1 as quantity_sold,
      CURRENT_DATE - (FLOOR(RANDOM() * 30 + 1)::integer) as sale_date,
      p.price * (0.8 + RANDOM() * 0.4) as price
    FROM products p
    WHERE NOT EXISTS (SELECT 1 FROM sales_history sh WHERE sh.product_id = p.id)
    LIMIT 20;
  `);
}


