-- mta-trader: Seed owner user
--
-- Before running this file:
--   1. Generate a bcrypt hash of the owner password:
--        node -e "const b = require('bcryptjs'); b.hash('YOUR_PASSWORD', 12).then(console.log)"
--   2. Replace <bcrypt-hash> below with the output of that command
--   3. Run: wrangler d1 execute mta-trader-db --file=src/db/seed-owner.sql
--
-- The owner email (wansing05@gmail.com) receives role = 'owner' automatically.

INSERT OR IGNORE INTO users (id, email, password_hash, role)
VALUES ('owner-001', 'wansing05@gmail.com', '<bcrypt-hash>', 'owner');
