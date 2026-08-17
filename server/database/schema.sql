-- =========================================================
-- ZAPLOFT DATABASE
-- =========================================================


-- =========================================================
-- USERS
--
-- Stores actual authenticated users.
--
-- Roles:
--   ADMIN
--   PARTNER
--
-- A website signup does NOT enter this table until
-- the admin approves the signup application.
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (
            role IN (
                'ADMIN',
                'PARTNER'
            )
        ),

    company_name VARCHAR(255),

    phone VARCHAR(30),

    profile_photo TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- EXISTING USERS TABLE SUPPORT
--
-- Safe migration for existing database.
-- =========================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_photo TEXT;


-- =========================================================
-- CUSTOMERS
-- =========================================================

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,

    partner_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    customer_name VARCHAR(255) NOT NULL,

    phone VARCHAR(30) NOT NULL,

    due_date VARCHAR(100),

    start_date VARCHAR(100),

    end_date VARCHAR(100),

    gender VARCHAR(30),

    age INTEGER,

    subscription VARCHAR(50),

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CAMPAIGNS
-- =========================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,

    partner_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    template_name VARCHAR(255) NOT NULL,

    language_code VARCHAR(20)
        DEFAULT 'en',

    total_count INTEGER
        DEFAULT 0,

    accepted_count INTEGER
        DEFAULT 0,

    sent_count INTEGER
        DEFAULT 0,

    delivered_count INTEGER
        DEFAULT 0,

    failed_count INTEGER
        DEFAULT 0,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- MESSAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,

    partner_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    campaign_id INTEGER
        REFERENCES campaigns(id)
        ON DELETE SET NULL,

    customer_id INTEGER
        REFERENCES customers(id)
        ON DELETE SET NULL,

    phone VARCHAR(30) NOT NULL,

    template_name VARCHAR(255),

    message_id VARCHAR(500),

    status VARCHAR(50)
        DEFAULT 'pending',

    error TEXT,

    sent_at TIMESTAMP,

    delivered_at TIMESTAMP,

    failed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- PARTNER SELF-SIGNUP APPLICATIONS
--
-- Website flow:
--
--   zaploft.in
--       ↓
--   Choose Plan
--       ↓
--   Create Account
--       ↓
--   This table
--       ↓
--   PENDING
--       ↓
--   Admin reviews
--       ↓
--   APPROVED
--       ↓
--   Real users row created
--       ↓
--   Partner can login
--
-- Password is stored as a bcrypt hash.
--
-- Email is the requested login email.
--
-- No users record is created until approval.
-- =========================================================

CREATE TABLE IF NOT EXISTS partner_signup_requests (
    id SERIAL PRIMARY KEY,

    plan_name VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    company_name VARCHAR(255) NOT NULL,

    phone VARCHAR(30),

    profile_photo TEXT,

    status VARCHAR(20) NOT NULL
        DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    admin_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    admin_note TEXT,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMP
);


CREATE TABLE IF NOT EXISTS partner_signup_requests (
    id SERIAL PRIMARY KEY,

    plan_name VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    company_name VARCHAR(255) NOT NULL,

    phone VARCHAR(30),

    profile_photo TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    admin_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    admin_note TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMP
);CREATE TABLE
-- =========================================================
-- PARTNER PROFILE CHANGE REQUESTS
--
-- Used AFTER a partner account has already been created.
--
-- Partner can request:
--
--   name
--   company_name
--   phone
--   profile_photo
--   password
--
-- Partner CANNOT request:
--
--   email
--   role
--   is_active
--
-- Flow:
--
--   Partner edits profile
--       ↓
--   PENDING
--       ↓
--   Admin reviews
--       ↓
--   APPROVED
--       ↓
--   users table updated
--
-- REJECTED means users table remains unchanged.
-- =========================================================

CREATE TABLE IF NOT EXISTS partner_profile_requests (
    id SERIAL PRIMARY KEY,

    partner_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    requested_name VARCHAR(150) NOT NULL,

    requested_company_name VARCHAR(255),

    requested_phone VARCHAR(30),

    requested_profile_photo TEXT,

    requested_password_hash TEXT,

    status VARCHAR(20) NOT NULL
        DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    admin_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    admin_note TEXT,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMP
);


-- =========================================================
-- INDEXES
-- =========================================================


-- =========================================================
-- USERS
-- =========================================================

CREATE INDEX IF NOT EXISTS
idx_users_role
ON users(role);


-- =========================================================
-- CUSTOMERS
-- =========================================================

CREATE INDEX IF NOT EXISTS
idx_customers_partner
ON customers(partner_id);

CREATE INDEX IF NOT EXISTS
idx_customers_phone
ON customers(phone);


-- =========================================================
-- CAMPAIGNS
-- =========================================================

CREATE INDEX IF NOT EXISTS
idx_campaigns_partner
ON campaigns(partner_id);


-- =========================================================
-- MESSAGES
-- =========================================================

CREATE INDEX IF NOT EXISTS
idx_messages_partner
ON messages(partner_id);

CREATE INDEX IF NOT EXISTS
idx_messages_customer
ON messages(customer_id);

CREATE INDEX IF NOT EXISTS
idx_messages_campaign
ON messages(campaign_id);

CREATE INDEX IF NOT EXISTS
idx_messages_message_id
ON messages(message_id);


-- =========================================================
-- PARTNER SIGNUP REQUESTS
-- =========================================================

CREATE INDEX IF NOT EXISTS
idx_partner_signup_requests_email
ON partner_signup_requests(email);

CREATE INDEX IF NOT EXISTS
idx_partner_signup_requests_status
ON partner_signup_requests(status);

CREATE INDEX IF NOT EXISTS
idx_partner_signup_requests_created
ON partner_signup_requests(created_at);


-- =========================================================
-- PARTNER PROFILE REQUESTS
-- =========================================================

CREATE INDEX IF NOT EXISTS
idx_partner_profile_requests_partner
ON partner_profile_requests(partner_id);

CREATE INDEX IF NOT EXISTS
idx_partner_profile_requests_status
ON partner_profile_requests(status);

CREATE INDEX IF NOT EXISTS
idx_partner_profile_requests_created
ON partner_profile_requests(created_at);


-- =========================================================
-- ONLY ONE PENDING SELF-SIGNUP PER EMAIL
--
-- A user can submit another application after a previous
-- one was rejected.
--
-- But multiple PENDING applications with the same email
-- are not allowed.
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_one_pending_signup_per_email
ON partner_signup_requests (
    LOWER(email)
)
WHERE status = 'PENDING';


-- =========================================================
-- ONLY ONE PENDING PROFILE CHANGE REQUEST PER PARTNER
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_one_pending_profile_request_per_partner
ON partner_profile_requests(partner_id)
WHERE status = 'PENDING';


-- =========================================================
-- VERIFY TABLES
-- =========================================================

SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'users',
      'customers',
      'campaigns',
      'messages',
      'partner_signup_requests',
      'partner_profile_requests'
  )
ORDER BY table_name;


-- =========================================================
-- VERIFY USERS COLUMNS
-- =========================================================

SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;


-- =========================================================
-- VERIFY PARTNER SIGNUP REQUEST COLUMNS
-- =========================================================

SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'partner_signup_requests'
ORDER BY ordinal_position;


-- =========================================================
-- VERIFY PARTNER PROFILE REQUEST COLUMNS
-- =========================================================

SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'partner_profile_requests'
ORDER BY ordinal_position;
