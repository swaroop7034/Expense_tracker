-- PG Expense Tracker Schema & Seed Data

-- 1. Create tables

CREATE TABLE members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  avatar_url  TEXT,
  color       TEXT NOT NULL,   -- predefined per member, see seed data
  is_active   BOOLEAN NOT NULL DEFAULT true,
  deleted_at  TIMESTAMPTZ,     -- soft delete
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  icon_name   TEXT NOT NULL,   -- lucide icon slug: 'shopping-cart', 'wifi', 'home'
  color       TEXT NOT NULL,   -- distinct hex per category
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category_id         UUID NOT NULL REFERENCES categories(id),
  split_type          TEXT NOT NULL DEFAULT 'equal'
                        CHECK (split_type IN ('equal', 'exact', 'percentage')),
  expense_type        TEXT NOT NULL DEFAULT 'regular'
                        CHECK (expense_type IN ('regular', 'recurring')),
  paid_by             UUID NOT NULL REFERENCES members(id),
  expense_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes               TEXT,
  is_favourite        BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule     JSONB,         -- { freq: 'monthly', day: 1, end_date: '2025-12-31' }
  parent_expense_id   UUID REFERENCES expenses(id),  -- recurring children
  deleted_at          TIMESTAMPTZ,   -- soft delete
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES members(id),   -- audit
  updated_by          UUID REFERENCES members(id)    -- audit
);

CREATE TABLE expense_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id    UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES members(id),
  share_amount  NUMERIC(12,2) NOT NULL CHECK (share_amount >= 0),
  share_percent NUMERIC(5,2),       -- populated when split_type = 'percentage'
  UNIQUE(expense_id, member_id)
);

CREATE TABLE settlements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_member   UUID NOT NULL REFERENCES members(id),
  to_member     UUID NOT NULL REFERENCES members(id),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes         TEXT,
  settled_date  DATE,
  deleted_at    TIMESTAMPTZ,        -- soft delete
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES members(id),
  updated_by    UUID REFERENCES members(id),
  CONSTRAINT no_self_settlement CHECK (from_member != to_member)
);

-- 2. Create Indexes

-- Expenses
CREATE INDEX idx_expenses_paid_by    ON expenses(paid_by)      WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_date       ON expenses(expense_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category   ON expenses(category_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_favourite  ON expenses(is_favourite)  WHERE deleted_at IS NULL AND is_favourite = true;

-- Participants
CREATE INDEX idx_participants_expense ON expense_participants(expense_id);
CREATE INDEX idx_participants_member  ON expense_participants(member_id);

-- Settlements
CREATE INDEX idx_settlements_from ON settlements(from_member) WHERE deleted_at IS NULL;
CREATE INDEX idx_settlements_to   ON settlements(to_member)   WHERE deleted_at IS NULL;
CREATE INDEX idx_settlements_status ON settlements(status)    WHERE deleted_at IS NULL;

-- 3. Create Triggers for updated_at

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 4. Insert Seed Data

-- Categories
INSERT INTO categories (name, icon_name, color, sort_order) VALUES
  ('Groceries', 'shopping-cart', '#10b981', 10),
  ('Vegetables', 'leaf', '#22c55e', 20),
  ('Gas', 'fuel', '#f59e0b', 30),
  ('Internet', 'wifi', '#3b82f6', 40),
  ('Cleaning', 'sparkles', '#8b5cf6', 50),
  ('Utilities', 'zap', '#f97316', 60),
  ('Snacks', 'cookie', '#ec4899', 70),
  ('Rent', 'home', '#06b6d4', 80),
  ('Miscellaneous', 'package', '#6b7280', 90);

-- Members
-- Using the requested hex colors
INSERT INTO members (name, color) VALUES
  ('Swaroop', '#6366f1'),
  ('Joel', '#10b981'),
  ('Akshay', '#f59e0b'),
  ('Afril', '#f43f5e'),
  ('Siddarth', '#0ea5e9'),
  ('Alan', '#8b5cf6');
