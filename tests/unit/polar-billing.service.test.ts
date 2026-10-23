import { describe, it, expect, beforeEach } from 'bun:test';
import { PolarBillingService } from '../../ts/apps/host/app/services/polar-billing.service';
import { PolarMeter, PolarIngestEvent, PolarBenefitType } from '../../ts/apps/host/app/models/webos.models';

describe('PolarBillingService', () => {
  let service: PolarBillingService;

  beforeEach(() => {
    service = new PolarBillingService();
  });

  it('should initialize with default meters, subscriptions, and active catalog products', () => {
    const meters = service.meters();
    const products = service.products();
    const customer = service.customerState('usr_operator_7842');

    expect(meters.length).toBeGreaterThanOrEqual(2);
    expect(products.length).toBeGreaterThanOrEqual(3);
    expect(customer).toBeDefined();
    expect(customer?.customerId).toBe('cus_verdigris_operator');
    expect(customer?.externalCustomerId).toBe('usr_operator_7842');
  });

  it('should create a usage meter with filter clauses and aggregation type', () => {
    const newMeter = service.createMeter({
      name: 'ai_tokens_meter',
      unit: 'token',
      filter: {
        conjunction: 'and',
        clauses: [{ property: 'name', operator: 'eq', value: 'ai_usage' }]
      },
      aggregation: { func: 'sum', property: 'total_tokens' }
    });

    expect(newMeter.id).toContain('mtr_');
    expect(newMeter.name).toBe('ai_tokens_meter');
    expect(newMeter.unit).toBe('token');
    expect(service.meters().some(m => m.id === newMeter.id)).toBe(true);
  });

  it('should ingest usage events and automatically compute aggregated meter quantities', () => {
    const events: PolarIngestEvent[] = [
      {
        name: 'ai_usage',
        external_customer_id: 'usr_operator_7842',
        metadata: {
          model: 'gemini-2.5-flash',
          total_tokens: 1200,
          prompt_tokens: 800,
          completion_tokens: 400,
          _cost: { amount: 2.4, currency: 'usd' }
        }
      },
      {
        name: 'ai_usage',
        external_customer_id: 'usr_operator_7842',
        metadata: {
          model: 'gemini-2.5-flash',
          total_tokens: 800,
          prompt_tokens: 500,
          completion_tokens: 300,
          _cost: { amount: 1.6, currency: 'usd' }
        }
      }
    ];

    const result = service.ingestEvents(events);
    expect(result.ingestedCount).toBe(2);
    expect(result.status).toBe('success');

    const customerState = service.getCustomerState('usr_operator_7842');
    const aiMeter = customerState.meters.find(m => m.meterName === 'AI LLM Inference Tokens');
    expect(aiMeter).toBeDefined();
    expect(aiMeter!.consumedUnits).toBeGreaterThanOrEqual(2000);
  });

  it('should track cost events accurately with decimal cents precision', () => {
    const initialCost = service.totalTrackedCostCents();

    service.ingestEvents([
      {
        name: 'cloud_execution',
        external_customer_id: 'usr_operator_7842',
        metadata: {
          duration_ms: 450,
          _cost: { amount: 15.5, currency: 'usd' }
        }
      }
    ]);

    expect(service.totalTrackedCostCents()).toBe(initialCost + 15.5);
  });

  it('should create an ad-hoc and catalog checkout session URL', () => {
    const checkout = service.createCheckoutSession({
      products: ['prod_core_kernel'],
      externalCustomerId: 'usr_operator_7842',
      customerEmail: 'operator@verdigris.cloud',
      successUrl: 'https://verdigris.cloud/success?checkout_id={CHECKOUT_ID}'
    });

    expect(checkout.checkoutId).toContain('chk_');
    expect(checkout.url).toContain('checkout.polar.sh');
    expect(checkout.status).toBe('open');
  });

  it('should validate and activate customer license keys', () => {
    const key = service.generateLicenseKey('prod_enterprise_cluster', 'usr_operator_7842');
    expect(key.key).toContain('POLAR_');
    expect(key.status).toBe('granted');

    const validation = service.validateLicenseKey(key.key, 'inst_node_mac_01');
    expect(validation.valid).toBe(true);
    expect(validation.activationsCount).toBe(1);
    expect(validation.licenseKey?.validations).toBe(1);
  });

  it('should verify standard webhook signatures and process subscription lifecycle transitions', () => {
    const webhookPayload = {
      type: 'order.paid',
      data: {
        id: 'ord_test_881',
        customer_id: 'cus_verdigris_operator',
        external_customer_id: 'usr_operator_7842',
        net_amount: 4900,
        currency: 'usd'
      }
    };

    const handled = service.processWebhookEvent(webhookPayload, 'sig_valid_test_payload');
    expect(handled.processed).toBe(true);
    expect(handled.eventType).toBe('order.paid');
  });
});
