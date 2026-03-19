-- BLOCK
-- Helper function to check farm membership
CREATE OR REPLACE FUNCTION is_farm_member(_farm_id INTEGER, _user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "farms" f WHERE f.id = _farm_id AND f."userId" = _user_id
  ) OR EXISTS (
    SELECT 1 FROM "farm_members" fm WHERE fm."farmId" = _farm_id AND fm."userId" = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BLOCK
-- Update Farm Isolation Policy
DROP POLICY IF EXISTS farm_isolation_policy ON "farms";
CREATE POLICY farm_isolation_policy ON "farms" 
  FOR ALL USING (
    "userId" = current_setting('app.current_user_id', true) OR
    EXISTS (
      SELECT 1 FROM "farm_members" fm 
      WHERE fm."farmId" = "farms".id AND fm."userId" = current_setting('app.current_user_id', true)
    )
  );

-- BLOCK
-- Update Poultry House Isolation Policy
DROP POLICY IF EXISTS house_isolation_policy ON "poultry_houses";
CREATE POLICY house_isolation_policy ON "poultry_houses" 
  FOR ALL USING (
    is_farm_member("farmId", current_setting('app.current_user_id', true))
  );

-- BLOCK
-- Update Batch Isolation Policy
DROP POLICY IF EXISTS batch_isolation_policy ON "batches";
CREATE POLICY batch_isolation_policy ON "batches" 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "poultry_houses" ph 
      WHERE ph.id = "batches"."houseId" AND is_farm_member(ph."farmId", current_setting('app.current_user_id', true))
    )
  );

-- BLOCK
-- Update Production Logs Policy (Special Role Handling)
DROP POLICY IF EXISTS production_isolation_policy ON "production_logs";
DROP POLICY IF EXISTS production_select_policy ON "production_logs";
DROP POLICY IF EXISTS production_insert_policy ON "production_logs";
DROP POLICY IF EXISTS production_modify_policy ON "production_logs";

-- Workers can only SELECT their own records
CREATE POLICY production_select_policy ON "production_logs"
  FOR SELECT USING (
    (
      -- Owner/Manager can see all
      EXISTS (
        SELECT 1 FROM "users" u 
        WHERE u.id = current_setting('app.current_user_id', true) 
        AND u.role IN ('OWNER', 'MANAGER')
      )
    ) OR (
      -- Worker can only see their own
      "userId" = current_setting('app.current_user_id', true)
    )
  );

-- BLOCK
-- All members can INSERT
CREATE POLICY production_insert_policy ON "production_logs"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "batches" b
      JOIN "poultry_houses" ph ON b."houseId" = ph.id
      WHERE b.id = "production_logs"."batchId" 
      AND is_farm_member(ph."farmId", current_setting('app.current_user_id', true))
    )
  );

-- BLOCK
-- Only Owner/Manager can UPDATE/DELETE
CREATE POLICY production_modify_policy ON "production_logs"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "users" u 
      WHERE u.id = current_setting('app.current_user_id', true) 
      AND u.role IN ('OWNER', 'MANAGER')
    )
  );

-- BLOCK
-- Update Feeding Logs Policy (Similar to Production)
DROP POLICY IF EXISTS inventory_isolation_policy ON "feed_inventory";
CREATE POLICY inventory_isolation_policy ON "feed_inventory" 
  FOR ALL USING (
    "userId" = current_setting('app.current_user_id', true) OR
    EXISTS (
      SELECT 1 FROM "users" u 
      WHERE u.id = current_setting('app.current_user_id', true) 
      AND u.role IN ('OWNER', 'MANAGER')
      AND EXISTS (
          SELECT 1 FROM "farms" f WHERE f."userId" = "feed_inventory"."userId"
      )
    )
  );
