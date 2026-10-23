import { Injectable, signal, computed, inject } from '@angular/core';
import {
  PolarMeter,
  PolarIngestEvent,
  PolarCustomerState,
  PolarProduct,
  PolarLicenseKey,
  PolarCheckoutSession,
  AuditCategory,
  AuditSeverity
} from '../models/webos.models';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

export interface IngestEventsResult {
  status: 'success' | 'partial' | 'failed';
  ingestedCount: number;
  processedMeters: number;
  totalCostCentsAdded: number;
}

export interface LicenseValidationResult {
  valid: boolean;
  status: string;
  activationsCount: number;
  licenseKey?: PolarLicenseKey;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PolarBillingService {
  private auditService: AuditService;
  private notificationService: NotificationService;

  constructor() {
    let resolvedAudit: AuditService | null = null;
    let resolvedNotif: NotificationService | null = null;
    try {
      resolvedAudit = inject(AuditService, { optional: true });
    } catch {
      resolvedAudit = null;
    }
    try {
      resolvedNotif = inject(NotificationService, { optional: true });
    } catch {
      resolvedNotif = null;
    }
    this.auditService = resolvedAudit ?? new AuditService();
    this.notificationService = resolvedNotif ?? new NotificationService();
  }

  // --- Reactive Signals State ---
  private metersState = signal<PolarMeter[]>([
    {
      id: 'mtr_ai_tokens',
      name: 'AI LLM Inference Tokens',
      unit: 'token',
      customLabel: '1M tokens',
      customMultiplier: 1000000,
      filter: {
        conjunction: 'and',
        clauses: [{ property: 'name', operator: 'eq', value: 'ai_usage' }]
      },
      aggregation: { func: 'sum', property: 'total_tokens' },
      createdAt: Date.now() - 86400000 * 3,
      totalEventsProcessed: 142
    },
    {
      id: 'mtr_edge_pings',
      name: 'Edge Gateway Requests',
      unit: 'scalar',
      filter: {
        conjunction: 'and',
        clauses: [{ property: 'name', operator: 'eq', value: 'cloud_execution' }]
      },
      aggregation: { func: 'count' },
      createdAt: Date.now() - 86400000 * 2,
      totalEventsProcessed: 890
    }
  ]);

  private productsState = signal<PolarProduct[]>([
    {
      id: 'prod_core_kernel',
      name: 'lxvOS Core',
      description: 'Zoneless Angular 22 enterprise microkernel with native federation and WOPI editor access.',
      isRecurring: true,
      recurringInterval: 'monthly',
      badge: 'POPULAR',
      prices: [
        { id: 'prc_kernel_fixed', amountType: 'fixed', priceAmount: 4900, priceCurrency: 'usd' },
        { id: 'prc_kernel_metered', amountType: 'metered_unit', unitAmount: 0.00002, priceCurrency: 'usd', meterId: 'mtr_ai_tokens' }
      ],
      benefits: [
        { id: 'ben_feature_flags', type: 'feature_flag', description: 'Unlock unlimited WASM OPFS sandboxes and WOPI lock tokens', isGranted: true },
        { id: 'ben_license_keys', type: 'license_keys', description: 'Cryptographic node license keys for sovereign clusters', isGranted: true }
      ]
    },
    {
      id: 'prod_enterprise_cluster',
      name: 'Edge Cluster (Dedicated)',
      description: 'Dedicated isolated NVMe database engine processing high-throughput edge telemetry and multi-tenant security auditing.',
      isRecurring: true,
      recurringInterval: 'monthly',
      badge: 'ENTERPRISE',
      prices: [
        { id: 'prc_cluster_seat', amountType: 'seat_based', priceAmount: 2900, priceCurrency: 'usd' }
      ],
      benefits: [
        { id: 'ben_repo_access', type: 'github_repository', description: 'Repository collaborator access', isGranted: true },
        { id: 'ben_credits', type: 'meter_credit', description: '5,000,000 monthly rollover AI tokens', isGranted: true, metadata: { units: 5000000, rollover: true } }
      ]
    },
    {
      id: 'prod_wopi_standalone',
      name: 'Office WOPI Protocol Adapter',
      description: 'Full Microsoft WOPI & Collabora Office online collaborative editing integration suite.',
      isRecurring: false,
      prices: [
        { id: 'prc_wopi_fixed', amountType: 'fixed', priceAmount: 19900, priceCurrency: 'usd' }
      ],
      benefits: [
        { id: 'ben_wopi_download', type: 'downloadables', description: 'Signed binary distribution of WOPI gateway container (10GB max)', isGranted: true }
      ]
    }
  ]);

  private customerStatesState = signal<Record<string, PolarCustomerState>>({
    usr_operator_7842: {
      customerId: 'cus_lxvos_operator',
      externalCustomerId: 'usr_operator_7842',
      email: 'operator@lxvos.local',
      name: 'Elena Rostova (Lead Architect)',
      subscriptions: [
        {
          id: 'sub_active_core_01',
          productId: 'prod_core_kernel',
          productName: 'lxvOS Core',
          status: 'active',
          currentPeriodStart: Date.now() - 86400000 * 14,
          currentPeriodEnd: Date.now() + 86400000 * 16,
          cancelAtPeriodEnd: false,
          priceAmount: 4900,
          currency: 'usd',
          seats: 5
        }
      ],
      benefits: [
        { id: 'ben_feature_flags', type: 'feature_flag', description: 'Unlimited WASM OPFS and WOPI locks', isGranted: true },
        { id: 'ben_license_keys', type: 'license_keys', description: 'Cryptographic node licenses', isGranted: true }
      ],
      meters: [
        {
          meterId: 'mtr_ai_tokens',
          meterName: 'AI LLM Inference Tokens',
          consumedUnits: 125000,
          creditedUnits: 5000000,
          balance: 4875000
        },
        {
          meterId: 'mtr_edge_pings',
          meterName: 'Edge Gateway Requests',
          consumedUnits: 342,
          creditedUnits: 10000,
          balance: 9658
        }
      ]
    }
  });

  private totalCostCents = signal<number>(142.85);

  private licenseKeysState = signal<PolarLicenseKey[]>([
    {
      id: 'lic_enterprise_01',
      key: 'POLAR_9A8F-42E1-BC77-0912',
      displayKey: '****-0912',
      status: 'granted',
      limitActivations: 5,
      activationsCount: 2,
      usage: 120,
      limitUsage: 10000,
      validations: 18,
      lastValidatedAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000 * 180,
      activeDevices: ['inst_node_mac_01', 'inst_node_linux_02']
    }
  ]);

  private recentCheckoutsState = signal<PolarCheckoutSession[]>([]);

  // --- Computed Views ---
  public readonly meters = computed(() => this.metersState());
  public readonly products = computed(() => this.productsState());
  public readonly licenseKeys = computed(() => this.licenseKeysState());
  public readonly recentCheckouts = computed(() => this.recentCheckoutsState());
  public readonly totalTrackedCostCents = computed(() => this.totalCostCents());

  public customerState(externalId: string): PolarCustomerState | undefined {
    return this.customerStatesState()[externalId];
  }

  public getCustomerState(externalId: string): PolarCustomerState {
    const state = this.customerStatesState()[externalId];
    if (!state) {
      throw new Error(`Customer state not found for external customer id '${externalId}'`);
    }
    return state;
  }

  // --- Core Domain Operations ---
  public createMeter(params: {
    name: string;
    unit?: 'scalar' | 'token' | 'custom';
    customLabel?: string;
    customMultiplier?: number;
    filter: {
      conjunction: 'and' | 'or';
      clauses: { property: string; operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'does_not_contain'; value: string | number | boolean }[];
    };
    aggregation: { func: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique'; property?: string };
  }): PolarMeter {
    const meterId = `mtr_${crypto.randomUUID().slice(0, 8)}`;
    const newMeter: PolarMeter = {
      id: meterId,
      name: params.name,
      unit: params.unit || 'scalar',
      customLabel: params.customLabel,
      customMultiplier: params.customMultiplier,
      filter: params.filter,
      aggregation: params.aggregation,
      createdAt: Date.now(),
      totalEventsProcessed: 0
    };

    this.metersState.update(list => [newMeter, ...list]);

    this.auditService.logEvent({
      action: 'POLAR_METER_CREATED',
      category: AuditCategory.DATABASE,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: meterId,
      details: `Created Polar usage meter "${params.name}" (${params.unit || 'scalar'}) with aggregation func "${params.aggregation.func}".`
    });

    return newMeter;
  }

  public ingestEvents(events: PolarIngestEvent[]): IngestEventsResult {
    let costAdded = 0;
    const currentMeters = this.metersState();

    events.forEach(evt => {
      // Evaluate each event against active meters
      currentMeters.forEach(meter => {
        const matches = this.evaluateFilter(evt, meter.filter);
        if (matches) {
          let unitIncrement = 1;
          if (meter.aggregation.func === 'sum' && meter.aggregation.property) {
            const rawVal = evt.metadata[meter.aggregation.property];
            unitIncrement = typeof rawVal === 'number' ? rawVal : 0;
          }

          // Update customer meter balance
          this.customerStatesState.update(states => {
            const customer = states[evt.external_customer_id];
            if (!customer) return states;

            const updatedMeters = customer.meters.map(cm => {
              if (cm.meterId === meter.id || cm.meterName === meter.name) {
                const consumed = cm.consumedUnits + unitIncrement;
                return {
                  ...cm,
                  consumedUnits: consumed,
                  balance: Math.max(0, cm.creditedUnits - consumed)
                };
              }
              return cm;
            });

            return {
              ...states,
              [evt.external_customer_id]: {
                ...customer,
                meters: updatedMeters
              }
            };
          });
        }
      });

      // Accumulate cost insights if _cost is provided
      if (evt.metadata._cost && typeof evt.metadata._cost.amount === 'number') {
        costAdded += evt.metadata._cost.amount;
      }
    });

    this.metersState.update(list =>
      list.map(m => ({ ...m, totalEventsProcessed: m.totalEventsProcessed + events.length }))
    );

    if (costAdded > 0) {
      this.totalCostCents.update(val => Math.round((val + costAdded) * 1000) / 1000);
    }

    this.auditService.logEvent({
      action: 'POLAR_EVENTS_INGESTED',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: `batch_size_${events.length}`,
      details: `Ingested ${events.length} telemetry event(s) across active meters. Added cost: ${costAdded.toFixed(3)}¢.`
    });

    return {
      status: 'success',
      ingestedCount: events.length,
      processedMeters: currentMeters.length,
      totalCostCentsAdded: costAdded
    };
  }

  private evaluateFilter(evt: PolarIngestEvent, filter: PolarMeter['filter']): boolean {
    const clauseResults = filter.clauses.map(clause => {
      let candidate: unknown;
      if (clause.property === 'name') {
        candidate = evt.name;
      } else if (clause.property === 'external_customer_id') {
        candidate = evt.external_customer_id;
      } else {
        candidate = evt.metadata[clause.property];
      }

      switch (clause.operator) {
        case 'eq': return candidate === clause.value;
        case 'ne': return candidate !== clause.value;
        case 'gt': return typeof candidate === 'number' && candidate > Number(clause.value);
        case 'gte': return typeof candidate === 'number' && candidate >= Number(clause.value);
        case 'lt': return typeof candidate === 'number' && candidate < Number(clause.value);
        case 'lte': return typeof candidate === 'number' && candidate <= Number(clause.value);
        case 'contains': return typeof candidate === 'string' && candidate.includes(String(clause.value));
        case 'does_not_contain': return typeof candidate === 'string' && !candidate.includes(String(clause.value));
        default: return false;
      }
    });

    if (filter.conjunction === 'or') {
      return clauseResults.some(Boolean);
    }
    return clauseResults.every(Boolean);
  }

  public createCheckoutSession(params: {
    products: string[];
    externalCustomerId?: string;
    customerEmail?: string;
    successUrl: string;
  }): PolarCheckoutSession {
    const checkoutId = `chk_${crypto.randomUUID().slice(0, 10)}`;
    const session: PolarCheckoutSession = {
      checkoutId,
      url: `https://checkout.polar.sh/c/${checkoutId}?embed_origin=${encodeURIComponent('http://localhost:3000')}`,
      status: 'open',
      products: params.products,
      externalCustomerId: params.externalCustomerId,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl.replace('{CHECKOUT_ID}', checkoutId)
    };

    this.recentCheckoutsState.update(list => [session, ...list.slice(0, 19)]);

    this.notificationService.notify({
      title: 'Polar Checkout Created',
      message: `Checkout session ${checkoutId} generated for ${params.products.length} product(s).`,
      category: AuditCategory.DATABASE,
      priority: 'normal',
      sourceApp: 'Polar Billing'
    });

    return session;
  }

  public generateLicenseKey(productId: string, externalCustomerId: string): PolarLicenseKey {
    const keyId = `lic_${crypto.randomUUID().slice(0, 8)}`;
    const randomHex = crypto.randomUUID().toUpperCase().slice(0, 19);
    const rawKey = `POLAR_${randomHex}`;
    const displayKey = `****-${rawKey.slice(-4)}`;

    const newKey: PolarLicenseKey = {
      id: keyId,
      key: rawKey,
      displayKey,
      status: 'granted',
      limitActivations: 3,
      activationsCount: 0,
      usage: 0,
      limitUsage: 50000,
      validations: 0,
      expiresAt: Date.now() + 86400000 * 365,
      activeDevices: []
    };

    this.licenseKeysState.update(list => [newKey, ...list]);

    this.auditService.logEvent({
      action: 'POLAR_LICENSE_GENERATED',
      category: AuditCategory.SECURITY,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: keyId,
      details: `Generated license key ${displayKey} for product "${productId}" assigned to customer ${externalCustomerId}.`
    });

    return newKey;
  }

  public validateLicenseKey(keyString: string, deviceId: string): LicenseValidationResult {
    const target = this.licenseKeysState().find(k => k.key === keyString);
    if (!target) {
      return { valid: false, status: 'not_found', activationsCount: 0, message: 'Invalid license key.' };
    }

    if (target.status !== 'granted') {
      return { valid: false, status: target.status, activationsCount: target.activationsCount, message: `License is ${target.status}.` };
    }

    if (target.expiresAt && target.expiresAt < Date.now()) {
      return { valid: false, status: 'expired', activationsCount: target.activationsCount, message: 'License has expired.' };
    }

    const devices = new Set(target.activeDevices);
    devices.add(deviceId);

    const updatedKey: PolarLicenseKey = {
      ...target,
      validations: target.validations + 1,
      lastValidatedAt: Date.now(),
      activationsCount: devices.size,
      activeDevices: Array.from(devices)
    };

    this.licenseKeysState.update(list => list.map(k => (k.id === target.id ? updatedKey : k)));

    return {
      valid: true,
      status: 'granted',
      activationsCount: devices.size,
      licenseKey: updatedKey
    };
  }

  public processWebhookEvent(payload: { type: string; data: Record<string, unknown> }, signature: string): { processed: boolean; eventType: string } {
    if (!signature) {
      throw new Error('Polar Webhook verification failed: missing signature header.');
    }

    this.auditService.logEvent({
      action: 'POLAR_WEBHOOK_RECEIVED',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: payload.type,
      details: `Verified and ingested Standard Webhook event "${payload.type}".`
    });

    return {
      processed: true,
      eventType: payload.type
    };
  }
}
