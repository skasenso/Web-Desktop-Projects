const { PrismaClient } = require('@prisma/client');

async function applyRLS() {
  const prisma = new PrismaClient();
  
  const statements = [
    // Helper function
    `CREATE OR REPLACE FUNCTION is_farm_member(_farm_id INTEGER, _user_id TEXT)
     RETURNS BOOLEAN AS $$
     BEGIN
       RETURN EXISTS (
         SELECT 1 FROM "farms" f WHERE f.id = _farm_id AND f."userId" = _user_id
       ) OR EXISTS (
         SELECT 1 FROM "farm_members" fm WHERE fm."farmId" = _farm_id AND fm."userId" = _user_id
       );
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Farm
    `DROP POLICY IF EXISTS farm_isolation_policy ON "farms"`,
    `CREATE POLICY farm_isolation_policy ON "farms" 
     FOR ALL USING (
       "userId" = current_setting('app.current_user_id', true) OR
       EXISTS (
         SELECT 1 FROM "farm_members" fm 
         WHERE fm."farmId" = "farms".id AND fm."userId" = current_setting('app.current_user_id', true)
       )
     )`,

    // House
    `DROP POLICY IF EXISTS house_isolation_policy ON "poultry_houses"`,
    `CREATE POLICY house_isolation_policy ON "poultry_houses" 
     FOR ALL USING (
       is_farm_member("farmId", current_setting('app.current_user_id', true))
     )`,

    // Batch
    `DROP POLICY IF EXISTS batch_isolation_policy ON "batches"`,
    `CREATE POLICY batch_isolation_policy ON "batches" 
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM "poultry_houses" ph 
         WHERE ph.id = "batches"."houseId" AND is_farm_member(ph."farmId", current_setting('app.current_user_id', true))
       )
     )`,

    // Production Logs
    `DROP POLICY IF EXISTS production_select_policy ON "production_logs"`,
    `CREATE POLICY production_select_policy ON "production_logs"
     FOR SELECT USING (
       (
         EXISTS (
           SELECT 1 FROM "users" u 
           WHERE u.id = current_setting('app.current_user_id', true) 
           AND u.role IN ('OWNER', 'MANAGER')
         )
       ) OR (
         "userId" = current_setting('app.current_user_id', true)
       )
     )`,

    `DROP POLICY IF EXISTS production_insert_policy ON "production_logs"`,
    `CREATE POLICY production_insert_policy ON "production_logs"
     FOR INSERT WITH CHECK (
       EXISTS (
         SELECT 1 FROM "batches" b
         JOIN "poultry_houses" ph ON b."houseId" = ph.id
         WHERE b.id = "production_logs"."batchId" 
         AND is_farm_member(ph."farmId", current_setting('app.current_user_id', true))
       )
     )`,

    `DROP POLICY IF EXISTS production_modify_policy ON "production_logs"`,
    `CREATE POLICY production_modify_policy ON "production_logs"
     FOR UPDATE USING (
       EXISTS (
         SELECT 1 FROM "users" u 
         WHERE u.id = current_setting('app.current_user_id', true) 
         AND u.role IN ('OWNER', 'MANAGER')
       )
     )`,

    // Inventory
    `DROP POLICY IF EXISTS inventory_isolation_policy ON "feed_inventory"`,
    `CREATE POLICY inventory_isolation_policy ON "feed_inventory" 
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
     )`
  ];

  console.log('Applying RLS policies statement by statement...');

  for (const sql of statements) {
    try {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(sql);
    } catch (error) {
      console.error(`Error executing statement: ${sql.substring(0, 50)}...`);
      console.error(error.message);
      // We continue to the next one unless it's a fatal setup error
    }
  }

  await prisma.$disconnect();
  console.log('RLS application process finished.');
}

applyRLS();
