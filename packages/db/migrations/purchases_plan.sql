ALTER TABLE purchases ADD COLUMN plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business'));
ALTER TABLE purchases ADD COLUMN invites_remaining INTEGER NOT NULL DEFAULT 1;
