-- ============================================================================
-- Verdigris Cloud OS - Canonical SQLite / libSQL DDL Specification
-- Location: /contracts/sql/schema.sql
-- Single Source of Truth for Data Structures (Neutral Layer)
-- ============================================================================

-- 1. System Configuration & OS Preferences
CREATE TABLE IF NOT EXISTS system_preferences (
    id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'dark',
    wallpaper_url TEXT,
    scaling_factor REAL NOT NULL DEFAULT 1.0,
    dock_position TEXT NOT NULL CHECK(dock_position IN ('left', 'bottom', 'right')),
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    desktop_toasts_enabled INTEGER NOT NULL DEFAULT 1,
    min_priority TEXT NOT NULL DEFAULT 'low',
    updated_at INTEGER NOT NULL
);

-- 2. Process Management (Active OS tasks)
CREATE TABLE IF NOT EXISTS active_processes (
    pid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    binary_path TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'suspended', 'crashed', 'terminated')),
    memory_usage INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL
);

-- 3. Virtual Window State (Hydration state for WebOS client)
CREATE TABLE IF NOT EXISTS window_states (
    window_id TEXT PRIMARY KEY,
    pid TEXT NOT NULL REFERENCES active_processes(pid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    x INTEGER NOT NULL DEFAULT 100,
    y INTEGER NOT NULL DEFAULT 100,
    width INTEGER NOT NULL DEFAULT 800,
    height INTEGER NOT NULL DEFAULT 600,
    z_index INTEGER NOT NULL DEFAULT 1,
    is_minimized INTEGER NOT NULL DEFAULT 0,
    is_maximized INTEGER NOT NULL DEFAULT 0
);

-- 4. User Profiles & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('administrator', 'content_creator', 'general_user')),
    avatar TEXT,
    department TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted_at INTEGER NOT NULL
);

-- 5. Tenant Identification & Control Plane Routing
CREATE TABLE IF NOT EXISTS tenant_contexts (
    tenant_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    roles_json TEXT NOT NULL DEFAULT '[]',
    turso_conn_url TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 6. Audit Trail Ledger (Append-Only Forensic Logs)
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('database', 'system', 'security', 'auth', 'wopi', 'rbac', 'filesystem', 'process')),
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'security', 'critical')),
    target_entity TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    details TEXT NOT NULL,
    ip_address TEXT
);

-- 7. Appwrite Multi-Database & Tables Infrastructure
CREATE TABLE IF NOT EXISTS appwrite_databases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    infrastructure TEXT NOT NULL CHECK(infrastructure IN ('shared', 'dedicated')),
    description TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    region TEXT NOT NULL DEFAULT 'us-central-shared',
    total_records INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appwrite_tables (
    id TEXT PRIMARY KEY,
    database_id TEXT NOT NULL REFERENCES appwrite_databases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    columns_count INTEGER NOT NULL DEFAULT 0,
    records_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appwrite_columns (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES appwrite_tables(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    type TEXT NOT NULL,
    required INTEGER NOT NULL DEFAULT 0,
    default_value TEXT
);

-- 8. Polar Usage Meters & Ingestion
CREATE TABLE IF NOT EXISTS polar_meters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK(unit IN ('scalar', 'token', 'custom')),
    custom_label TEXT,
    custom_multiplier INTEGER DEFAULT 1,
    filter_json TEXT NOT NULL,
    aggregation_json TEXT NOT NULL,
    total_events_processed INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS polar_customer_states (
    customer_id TEXT PRIMARY KEY,
    external_customer_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS polar_license_keys (
    id TEXT PRIMARY KEY,
    license_key TEXT NOT NULL UNIQUE,
    display_key TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('granted', 'revoked', 'disabled')),
    limit_activations INTEGER NOT NULL DEFAULT 1,
    activations_count INTEGER NOT NULL DEFAULT 0,
    usage INTEGER NOT NULL DEFAULT 0,
    limit_usage INTEGER,
    validations INTEGER NOT NULL DEFAULT 0,
    active_devices_json TEXT NOT NULL DEFAULT '[]',
    last_validated_at INTEGER,
    expires_at INTEGER
);

-- 9. The Ξ (Xi) Economy & CogniOps Ledger
CREATE TABLE IF NOT EXISTS xi_cogs_breakdowns (
    id TEXT PRIMARY KEY,
    c_infra REAL NOT NULL,
    w_infra REAL NOT NULL,
    c_exec REAL NOT NULL,
    w_exec REAL NOT NULL,
    c_align REAL NOT NULL,
    w_align REAL NOT NULL,
    c_valid REAL NOT NULL,
    w_valid REAL NOT NULL,
    calculated_floor REAL NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS xi_ledger (
    id TEXT PRIMARY KEY,
    available_supply REAL NOT NULL,
    minted_fiat_purchased REAL NOT NULL,
    minted_poa_pool REAL NOT NULL,
    burned_execution_pool REAL NOT NULL,
    burned_elastic_access_pool REAL NOT NULL,
    terminal_operational_cogs_usd REAL NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS xi_hpvc_proposals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    constant_key TEXT NOT NULL CHECK(constant_key IN ('xiFloor', 'mintingMultiplier', 'qualityExponent', 'overageRate')),
    proposed_value REAL NOT NULL,
    previous_value REAL NOT NULL,
    justification TEXT NOT NULL,
    proposer_role TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'approved', 'rejected')),
    approvals INTEGER NOT NULL DEFAULT 0,
    rejections INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);
