-- NeuralMart database schema (PostgreSQL / Neon).
-- Safe to run repeatedly: every object is created only if it does not exist.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  icon         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  brand_colors TEXT[] NOT NULL DEFAULT ARRAY['#8b5cf6', '#3b82f6'],
  sort_order   INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS apps (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  tagline        TEXT NOT NULL,
  description    TEXT NOT NULL,
  category_id    INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  seller_id      INT REFERENCES users(id) ON DELETE SET NULL,
  icon_url       TEXT,
  price_monthly  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
  price_yearly   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_yearly >= 0),
  has_free_trial BOOLEAN NOT NULL DEFAULT false,
  rating_avg     NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  rating_count   INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- presentation extras used by the UI
  icon_name      TEXT NOT NULL DEFAULT 'Sparkles',
  brand_colors   TEXT[] NOT NULL DEFAULT ARRAY['#8b5cf6', '#3b82f6'],
  trial_days     INT NOT NULL DEFAULT 14,
  hours_saved    INT NOT NULL DEFAULT 0,
  use_cases      TEXT[] NOT NULL DEFAULT '{}',
  integrations   TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS apps_category_idx   ON apps (category_id);
CREATE INDEX IF NOT EXISTS apps_seller_idx     ON apps (seller_id);
CREATE INDEX IF NOT EXISTS apps_featured_idx   ON apps (is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS apps_rating_idx     ON apps (rating_avg DESC);
CREATE INDEX IF NOT EXISTS apps_popular_idx    ON apps (rating_count DESC);
CREATE INDEX IF NOT EXISTS apps_created_idx    ON apps (created_at DESC);
CREATE INDEX IF NOT EXISTS apps_price_idx      ON apps (price_monthly);

CREATE TABLE IF NOT EXISTS app_features (
  id           SERIAL PRIMARY KEY,
  app_id       INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  order_index  INT NOT NULL DEFAULT 0,
  UNIQUE (app_id, order_index)
);

CREATE TABLE IF NOT EXISTS app_screenshots (
  id          SERIAL PRIMARY KEY,
  app_id      INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  UNIQUE (app_id, order_index)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  app_id     INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (app_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_app_idx  ON reviews (app_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON reviews (user_id);

CREATE TABLE IF NOT EXISTS bundles (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  price           NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  savings_percent INT NOT NULL CHECK (savings_percent BETWEEN 0 AND 100),
  -- presentation extras
  slug            TEXT NOT NULL UNIQUE,
  icon_name       TEXT NOT NULL DEFAULT 'Sparkles',
  brand_colors    TEXT[] NOT NULL DEFAULT ARRAY['#8b5cf6', '#3b82f6']
);

CREATE TABLE IF NOT EXISTS bundle_apps (
  id        SERIAL PRIMARY KEY,
  bundle_id INT NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  app_id    INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  UNIQUE (bundle_id, app_id)
);
CREATE INDEX IF NOT EXISTS bundle_apps_app_idx ON bundle_apps (app_id);

CREATE TABLE IF NOT EXISTS wishlist (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id     INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);
CREATE INDEX IF NOT EXISTS wishlist_app_idx ON wishlist (app_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id        SERIAL PRIMARY KEY,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id    INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  plan      TEXT NOT NULL DEFAULT 'monthly' CHECK (plan IN ('monthly', 'yearly')),
  quantity  INT NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 50),
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- set when the item was added as part of a bundle (bundle discount applies)
  bundle_id INT REFERENCES bundles(id) ON DELETE SET NULL,
  UNIQUE (user_id, app_id)
);
CREATE INDEX IF NOT EXISTS cart_items_app_idx ON cart_items (app_id);

CREATE TABLE IF NOT EXISTS promo_codes (
  code        TEXT PRIMARY KEY,
  percent_off INT NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total      NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  promo_code TEXT REFERENCES promo_codes(code) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id       SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  app_id   INT NOT NULL REFERENCES apps(id) ON DELETE RESTRICT,
  plan     TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  price    NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_app_idx   ON order_items (app_id);

CREATE TABLE IF NOT EXISTS user_apps (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id        INT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  renews_at     TIMESTAMPTZ NOT NULL,
  usage_minutes INT NOT NULL DEFAULT 0 CHECK (usage_minutes >= 0),
  UNIQUE (user_id, app_id)
);
CREATE INDEX IF NOT EXISTS user_apps_app_idx ON user_apps (app_id);
