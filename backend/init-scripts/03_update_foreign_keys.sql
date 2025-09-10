-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS sales_history
    DROP CONSTRAINT IF EXISTS sales_history_product_id_fkey;

ALTER TABLE IF EXISTS events
    DROP CONSTRAINT IF EXISTS events_product_id_fkey;

-- Recreate foreign key constraints with ON DELETE CASCADE
ALTER TABLE sales_history
    ADD CONSTRAINT sales_history_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE;

ALTER TABLE events
    ADD CONSTRAINT events_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE;
