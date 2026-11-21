// Re-export canonical downstream contract types generated from /contracts/openapi/webos.v1.yaml
export type {
  components as WebOsApiComponents,
  paths as WebOsApiPaths,
  SystemPreferencesContract,
  ProcessContract,
  WindowStateContract,
  UserProfileContract,
  TenantContextContract,
  PolarIngestEventContract,
  PolarCheckoutSessionContract,
  PolarCustomerStateContract,
  CogniOpsCogsBreakdownContract,
  XiFloorDataContract,
  PoAContributionParamsContract,
  PoARewardResultContract,
  XiSankeyFlowContract
} from '../../generated/api.types';

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

export type PolarMeterUnit = 'scalar' | 'token' | 'custom';

export interface PolarClause {
  property: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'does_not_contain';
  value: string | number | boolean;
}

export interface PolarFilter {
  conjunction: 'and' | 'or';
  clauses: PolarClause[];
}

export interface PolarAggregation {
  func: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique';
  property?: string;
}

export interface PolarMeter {
  id: string;
  name: string;
  unit: PolarMeterUnit;
  customLabel?: string;
  customMultiplier?: number;
  filter: PolarFilter;
  aggregation: PolarAggregation;
  createdAt: number;
  totalEventsProcessed: number;
  isArchived?: boolean;
}

export interface PolarCostMetadata {
  amount: number; // In cents with decimal sub-cent precision
  currency: 'usd';
}

export interface PolarIngestEvent {
  name: string;
  customer_id?: string;
  external_customer_id: string;
  timestamp?: number;
  metadata: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    duration_ms?: number;
    bytes?: number;
    model?: string;
    _cost?: PolarCostMetadata;
    [key: string]: unknown;
  };
}

export type PolarBenefitType = 'custom' | 'discord' | 'github_repository' | 'downloadables' | 'license_keys' | 'meter_credit' | 'feature_flag' | 'slack_shared_channel';

export interface PolarBenefit {
  id: string;
  type: PolarBenefitType;
  description: string;
  isGranted: boolean;
  metadata?: Record<string, unknown>;
}

export interface PolarLicenseKey {
  id: string;
  key: string;
  displayKey: string;
  status: 'granted' | 'revoked' | 'disabled';
  limitActivations: number;
  activationsCount: number;
  usage: number;
  limitUsage?: number;
  validations: number;
  lastValidatedAt?: number;
  expiresAt?: number;
  activeDevices: string[];
}

export interface PolarCustomerMeter {
  meterId: string;
  meterName: string;
  consumedUnits: number;
  creditedUnits: number;
  balance: number;
}

export interface PolarCustomerSubscription {
  id: string;
  productId: string;
  productName: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  priceAmount: number;
  currency: string;
  seats?: number;
}

export interface PolarCustomerState {
  customerId: string;
  externalCustomerId: string;
  email: string;
  name: string;
  subscriptions: PolarCustomerSubscription[];
  benefits: PolarBenefit[];
  meters: PolarCustomerMeter[];
}

export interface PolarProductPrice {
  id: string;
  amountType: 'fixed' | 'metered_unit' | 'seat_based' | 'custom' | 'free';
  priceAmount?: number;
  priceCurrency: string;
  unitAmount?: number;
  meterId?: string;
}

export interface PolarProduct {
  id: string;
  name: string;
  description: string;
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'yearly';
  prices: PolarProductPrice[];
  benefits: PolarBenefit[];
  badge?: string;
}

export interface PolarCheckoutSession {
  checkoutId: string;
  url: string;
  status: 'open' | 'confirmed' | 'succeeded' | 'expired';
  products: string[];
  externalCustomerId?: string;
  customerEmail?: string;
  successUrl: string;
}

// ==========================================
// The Ξ (Xi) Economy & CogniOps Architecture
// ==========================================

export interface CogniOpsCogsBreakdown {
  cInfra: number; // Normalized GPU-second (N-GPS) cost
  wInfra: number; // Weight (e.g. 0.25)
  cExec: number;  // Agent execution/inference steps cost
  wExec: number;  // Weight (e.g. 0.40)
  cAlign: number; // Pro-rated Alignment Cost (PAC: LoRA/DPO fine-tuning)
  wAlign: number; // Weight (e.g. 0.20)
  cValid: number; // Validator Consensus Rate (VCR) cost
  wValid: number; // Weight (e.g. 0.15)
}

export interface XiFloorData {
  xiFloorUsd: number;
  fiatPegCurrency: 'CAD' | 'USD';
  fiatRatio: number; // Contractually fixed (e.g. 1.0)
  components: CogniOpsCogsBreakdown;
  lastUpdated: number;
}

export interface PoAContributionParams {
  contributorId: string;
  datasetWeightNk: number;     // N_k: Dataset size weight
  qualityFactorFk: number;     // F_k: RLHF/DPO preference alignment score [0, 1]
  efficacyImpactEdata: number; // E_data: Counterfactual model lift multiplier
}

export interface PoARewardResult {
  rewardXi: number;
  calculationBreakdown: string;
  classification: 'strategic_cogs_investment';
  timestamp: number;
}

export interface XiLedgerState {
  availableSupply: number;
  mintedFiatPurchased: number;
  mintedPoaPool: number;
  burnedExecutionPool: number;
  burnedElasticAccessPool: number;
  terminalOperationalCogsUsd: number;
}

export interface SankeyNode {
  id: string;
  label: string;
  category: 'input' | 'currency' | 'output' | 'investment' | 'terminal';
  value: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

export interface XiSankeyFlow {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalVolumeXi: number;
  totalFiatInflowUsd: number;
  strategicCogsRatio: number;
}

export interface UpgradeThresholdResult {
  currentTier: string;
  targetTier: string;
  fixedDifference: number;
  rateDifference: number;
  optimalUpgradeXiUnits: number;
  formula: string;
  shouldRecommendUpgrade: (currentMonthlyConsumption: number) => boolean;
}

export interface HpvcProposal {
  id: string;
  title: string;
  constantKey: 'xiFloor' | 'mintingMultiplier' | 'qualityExponent' | 'overageRate';
  proposedValue: number;
  previousValue: number;
  justification: string;
  proposerRole: string;
  status: 'active' | 'approved' | 'rejected';
  approvals: number;
  rejections: number;
  createdAt: number;
}


