export interface ProcessDescriptor {
  pid: string;
  appId: string;
  title: string;
  icon: string;
  isOpen?: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  zIndex?: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  state?: 'RUNNING' | 'TERMINATED' | string;
  manifestUrl?: string;
  entryComponent?: string;
  componentName?: string;
  remoteUrl?: string;
  isFederated?: boolean;
  federatedConfig?: unknown;
  category?: 'productivity' | 'system' | 'developer' | 'ai' | 'security' | string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
}

export const UserRole = {
  ADMIN: 'administrator',
  CREATOR: 'content_creator',
  USER: 'general_user'
} as const;
export type UserRole = 'administrator' | 'content_creator' | 'general_user' | string;

export const AuditCategory = {
  DATABASE: 'database',
  SYSTEM: 'system',
  SECURITY: 'security',
  AUTH: 'auth',
  WOPI: 'wopi',
  RBAC: 'rbac',
  FILESYSTEM: 'filesystem',
  PROCESS: 'process',
} as const;
export type AuditCategory = 'database' | 'system' | 'security' | 'auth' | 'wopi' | 'rbac' | 'filesystem' | 'process' | string;

export const AuditSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  SECURITY: 'security',
  CRITICAL: 'critical',
} as const;
export type AuditSeverity = 'info' | 'warning' | 'security' | 'critical' | string;

export type Permission = string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  permissions: Permission[];
}

export interface AppwriteColumn {
  name?: string;
  key?: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  default?: unknown;
}

export interface AppwriteTable {
  id: string;
  name: string;
  columnsCount?: number;
  recordsCount?: number;
  createdAt?: number;
  columns: AppwriteColumn[];
  sampleRecords?: unknown[];
}

export interface AppwriteDatabase {
  id: string;
  name: string;
  tables: AppwriteTable[];
  totalRecords?: number;
  infrastructure?: 'shared' | 'dedicated';
  description?: string;
  enabled?: boolean;
  region?: string;
  createdAt?: number;
}

export interface RemoteDefinition {
  id?: string;
  name: string;
  url: string;
  remoteName?: string;
  remoteEntry?: string;
  status: 'ONLINE' | 'STANDBY' | 'CONNECTING' | 'ERROR';
  description: string;
  version: string;
  exposedModule: string;
  latencyMs?: number;
  lastChecked?: number;
  icon?: string;
  remoteEntryUrl?: string;
}

export interface AppManifest {
  id: string;
  name: string;
  title?: string;
  icon: string;
  description: string;
  componentName?: string;
  entryComponent?: string;
  category: string;
  isFederated?: boolean;
  remoteUrl?: string;
  federatedConfig?: unknown;
  version?: string;
  sandboxType?: string;
}

export interface VfsInode {
  id: number | string;
  name?: string;
  type?: 'file' | 'directory' | string;
  mode?: number;
  size: number;
  mtime?: number;
  updatedAt?: number;
  parentId?: string;
  data?: string;
  content?: string;
}

export interface ToolCallRecord {
  id?: string;
  execId?: string;
  toolName: string;
  sandboxId?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  durationMs?: number;
  success?: boolean;
  startedAt?: number;
  completedAt?: number;
  createdAt?: number;
  errorMessage?: string;
}

export interface WopiDocument {
  id?: string;
  fileId: string;
  baseFileName: string;
  filename?: string;
  ownerId: string;
  size: number;
  sizeBytes?: number;
  userId?: string;
  userFriendlyName?: string;
  version: string;
  userCanWrite?: boolean;
  supportsUpdate?: boolean;
  supportsLocks?: boolean;
  content?: string;
  fileType?: string;
  updatedAt?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userRole: string;
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  targetEntity?: string;
  status?: 'success' | 'failure' | 'blocked' | string;
  details: string;
  ipAddress?: string;
}

export type NotificationCategory = 'task' | 'update' | 'security' | 'message' | 'database' | 'system' | 'audit' | string;
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical' | string;

export interface WebOsNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  sourceApp?: string;
  actionLabel?: string;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  desktopToastsEnabled: boolean;
  categories: {
    task?: boolean;
    message?: boolean;
    update?: boolean;
    security?: boolean;
    [key: string]: boolean | undefined;
  };
  minPriority?: NotificationPriority;
}

export interface TenantContext {
  userId: string;
  tenantId: string;
  roles: string[];
  tursoConnUrl: string;
}
