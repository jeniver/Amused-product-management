-- Function to notify clients about events
CREATE OR REPLACE FUNCTION notify_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'events_channel',
    json_build_object(
      'type', NEW.type,
      'seller_id', NEW.seller_id,
      'product_id', NEW.product_id,
      'payload', NEW.payload
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on events table
DROP TRIGGER IF EXISTS events_notify_trigger ON events;
CREATE TRIGGER events_notify_trigger
  AFTER INSERT
  ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event();
