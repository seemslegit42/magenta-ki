import { Injectable, signal, computed, inject } from '@angular/core';
import {
  CogniOpsCogsBreakdown,
  XiFloorData,
  PoAContributionParams,
  PoARewardResult,
  XiLedgerState,
  XiSankeyFlow,
  UpgradeThresholdResult,
  HpvcProposal,
  AuditCategory,
  AuditSeverity
} from '../models/webos.models';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

export interface BurnCogniOpsParams {
  customerId: string;
  xiUnits: number;
  reason: string;
  isElasticAccess?: boolean;
}

export interface BurnCogniOpsResult {
  success: boolean;
  burnedXi: number;
  remainingBalance: number;
  revenueRecognizedUsd: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class XiEconomyService {
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

  // --- Economic Constants & State (Signals) ---
  private mintingMultiplier = signal<number>(1.25); // M_Xi
  private qualityExponent = signal<number>(1.5);    // alpha

  private cogsBreakdown = signal<CogniOpsCogsBreakdown>({
    cInfra: 0.012, // Normalized GPU-Second (N-GPS)
    wInfra: 0.25,
    cExec: 0.024,  // Agent steps
    wExec: 0.40,
    cAlign: 0.035, // PAC (LoRA & DPO fine-tuning)
    wAlign: 0.20,
    cValid: 0.008, // VCR (Consensus rate)
    wValid: 0.15
  });

  private customerBalances = signal<Record<string, number>>({
    usr_operator_7842: 1250,
    usr_admin_01: 5000,
    usr_creator_02: 850,
    usr_user_03: 320
  });

  private ledgerState = signal<XiLedgerState>({
    availableSupply: 245000,
    mintedFiatPurchased: 200000,
    mintedPoaPool: 45000,
    burnedExecutionPool: 128500,
    burnedElasticAccessPool: 34200,
    terminalOperationalCogsUsd: 2840.50
  });

  private hpvcProposals = signal<HpvcProposal[]>([
    {
      id: 'prop_hpvc_01',
      title: 'Index Xi Floor to reflect 15% GPU cluster efficiency optimization',
      constantKey: 'xiFloor',
      proposedValue: 0.0185,
      previousValue: 0.0208,
      justification: 'Quantization & task decomposition reduced inference GPU-second load across cluster',
      proposerRole: 'administrator',
      status: 'approved',
      approvals: 14,
      rejections: 1,
      createdAt: Date.now() - 86400000 * 5
    },
    {
      id: 'prop_hpvc_02',
      title: 'Calibrate Quality Exponent alpha from 1.5 to 1.6 for stringent DPO curation',
      constantKey: 'qualityExponent',
      proposedValue: 1.6,
      previousValue: 1.5,
      justification: 'Incentivize high-consensus RLHF preferences and discourage sub-threshold submissions',
      proposerRole: 'administrator',
      status: 'active',
      approvals: 8,
      rejections: 2,
      createdAt: Date.now() - 86400000 * 1
    }
  ]);

  // --- Computed Views ---
  public readonly currentFloor = computed<XiFloorData>(() => {
    const cogs = this.cogsBreakdown();
    const floor = this.calculateFloorCost(cogs);
    return {
      xiFloorUsd: floor,
      fiatPegCurrency: 'CAD',
      fiatRatio: 1.0,
      components: cogs,
      lastUpdated: Date.now()
    };
  });

  public readonly ledger = computed(() => this.ledgerState());
  public readonly proposals = computed(() => this.hpvcProposals());
  public readonly constants = computed(() => ({
    mintingMultiplier: this.mintingMultiplier(),
    qualityExponent: this.qualityExponent()
  }));

  // --- Core Methods ---

  /**
   * Calculates the weighted unit cost floor: Xi_Floor = sum(w_i * C_i)
   */
  public calculateFloorCost(breakdown: CogniOpsCogsBreakdown): number {
    const total =
      breakdown.cInfra * breakdown.wInfra +
      breakdown.cExec * breakdown.wExec +
      breakdown.cAlign * breakdown.wAlign +
      breakdown.cValid * breakdown.wValid;
    return Math.round(total * 10000) / 10000;
  }

  public updateCogsComponent(key: keyof CogniOpsCogsBreakdown, value: number): void {
    this.cogsBreakdown.update(current => ({ ...current, [key]: value }));
  }

  public getCustomerXiBalance(customerId: string): number {
    return this.customerBalances()[customerId] || 0;
  }

  /**
   * Section II: Hybrid SaaS Tiered Upgrade Threshold calculation (U_upgrade)
   * Formula: U_upgrade = Q_lower + (X_higher - X_lower) / (R_lower - R_higher)
   */
  public calculateUpgradeThreshold(
    currentTier: 'starter' | 'professional',
    targetTier: 'professional' | 'enterprise'
  ): UpgradeThresholdResult {
    const tiers = {
      starter: { fee: 50, quota: 1000, overageRate: 0.08 },
      professional: { fee: 180, quota: 4000, overageRate: 0.05 },
      enterprise: { fee: 750, quota: 20000, overageRate: 0.03 }
    };

    const lower = tiers[currentTier];
    const higher = tiers[targetTier];

    const fixedDiff = higher.fee - lower.fee;
    const rateDiff = lower.overageRate - higher.overageRate;
    const optimalAdditionalUnits = rateDiff > 0 ? fixedDiff / rateDiff : 0;
    const optimalUpgradeXiUnits = Math.round(lower.quota + optimalAdditionalUnits);

    return {
      currentTier,
      targetTier,
      fixedDifference: fixedDiff,
      rateDifference: rateDiff,
      optimalUpgradeXiUnits,
      formula: `U_upgrade = ${lower.quota} + (${higher.fee} - ${lower.fee}) / (${lower.overageRate} - ${higher.overageRate}) = ${optimalUpgradeXiUnits} Ξ`,
      shouldRecommendUpgrade: (currentMonthlyConsumption: number) =>
        currentMonthlyConsumption >= optimalUpgradeXiUnits
    };
  }

  /**
   * Section III: Proof-of-Attribution (PoA) Reward Engine
   * Formula: R_Xi = M_Xi * N_k * (F_k)^alpha * E_data
   */
  public calculateAndMintPoaReward(params: PoAContributionParams): PoARewardResult {
    const mXi = this.mintingMultiplier();
    const alpha = this.qualityExponent();

    // R_Xi calculation
    const rawReward =
      mXi *
      params.datasetWeightNk *
      Math.pow(params.qualityFactorFk, alpha) *
      params.efficacyImpactEdata;

    const rewardXi = Math.round(rawReward * 100) / 100;

    // Credit to contributor's balance
    this.customerBalances.update(balances => ({
      ...balances,
      [params.contributorId]: (balances[params.contributorId] || 0) + rewardXi
    }));

    // Update global ledger: minting strategic COGS pool
    this.ledgerState.update(state => ({
      ...state,
      availableSupply: state.availableSupply + rewardXi,
      mintedPoaPool: state.mintedPoaPool + rewardXi
    }));

    this.auditService.logEvent({
      action: 'XI_POA_REWARD_MINTED',
      category: AuditCategory.DATABASE,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: params.contributorId,
      details: `Minted ${rewardXi} Ξ via Proof-of-Attribution [Nk=${params.datasetWeightNk}, Fk=${params.qualityFactorFk}, Edata=${params.efficacyImpactEdata}]. Classified as Strategic COGS Investment.`
    });

    this.notificationService.notify({
      title: 'Ξ PoA Reward Credited',
      message: `You earned ${rewardXi} Ξ for validated high-consensus model alignment data.`,
      category: AuditCategory.DATABASE,
      priority: 'high',
      sourceApp: 'The Ξ Economy'
    });

    return {
      rewardXi,
      calculationBreakdown: `R_Xi = ${mXi} * ${params.datasetWeightNk} * (${params.qualityFactorFk}^${alpha}) * ${params.efficacyImpactEdata} = ${rewardXi} Ξ`,
      classification: 'strategic_cogs_investment',
      timestamp: Date.now()
    };
  }

  /**
   * Section III: Burning Ξ for CogniOps Execution or Elastic Access (Revenue Recognition)
   */
  public burnCogniOps(params: BurnCogniOpsParams): BurnCogniOpsResult {
    const current = this.customerBalances()[params.customerId] || 0;
    if (current < params.xiUnits) {
      throw new Error(`Insufficient Ξ balance: Available ${current} Ξ, required ${params.xiUnits} Ξ.`);
    }

    const newBalance = current - params.xiUnits;

    this.customerBalances.update(balances => ({
      ...balances,
      [params.customerId]: newBalance
    }));

    // Update ledger burning pools
    this.ledgerState.update(state => ({
      ...state,
      availableSupply: state.availableSupply - params.xiUnits,
      burnedExecutionPool: params.isElasticAccess ? state.burnedExecutionPool : state.burnedExecutionPool + params.xiUnits,
      burnedElasticAccessPool: params.isElasticAccess ? state.burnedElasticAccessPool + params.xiUnits : state.burnedElasticAccessPool,
      terminalOperationalCogsUsd: state.terminalOperationalCogsUsd + params.xiUnits * 0.0208
    }));

    this.auditService.logEvent({
      action: 'XI_COGNIOPS_BURNED',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: params.customerId,
      details: `Burned ${params.xiUnits} Ξ for "${params.reason}" (Elastic Access: ${Boolean(params.isElasticAccess)}). Recognized revenue.`
    });

    return {
      success: true,
      burnedXi: params.xiUnits,
      remainingBalance: newBalance,
      revenueRecognizedUsd: params.xiUnits * 1.0, // 1:1 Peg
      message: `Burned ${params.xiUnits} Ξ. Remaining balance: ${newBalance} Ξ.`
    };
  }

  /**
   * Section IV: Sankey Diagram Flow Topology Generator
   */
  public generateSankeyFlow(): XiSankeyFlow {
    const state = this.ledgerState();

    const nodes = [
      { id: 'fiat_sub', label: 'Customer Payments (Subscriptions)', category: 'input' as const, value: 160000 },
      { id: 'fiat_overage', label: 'Customer Payments (Overage)', category: 'input' as const, value: 40000 },
      { id: 'xi_pool', label: 'Available Ξ Pool (Minted Supply)', category: 'currency' as const, value: state.availableSupply },
      { id: 'exec_burn', label: 'CogniOps Execution (Revenue)', category: 'output' as const, value: state.burnedExecutionPool },
      { id: 'elastic_burn', label: 'Elastic Feature Access (Revenue)', category: 'output' as const, value: state.burnedElasticAccessPool },
      { id: 'poa_invest', label: 'Proof-of-Attribution Rewards', category: 'investment' as const, value: state.mintedPoaPool },
      { id: 'terminal_cogs', label: 'Operational Costs (Hosting & GPU)', category: 'terminal' as const, value: state.terminalOperationalCogsUsd }
    ];

    const links = [
      { source: 'Customer Payments (Subscriptions)', target: 'Available Ξ Pool (Minted Supply)', value: 160000 },
      { source: 'Customer Payments (Overage)', target: 'Available Ξ Pool (Minted Supply)', value: 40000 },
      { source: 'Proof-of-Attribution Rewards', target: 'Available Ξ Pool (Minted Supply)', value: state.mintedPoaPool },
      { source: 'Available Ξ Pool (Minted Supply)', target: 'CogniOps Execution (Revenue)', value: state.burnedExecutionPool },
      { source: 'Available Ξ Pool (Minted Supply)', target: 'Elastic Feature Access (Revenue)', value: state.burnedElasticAccessPool },
      { source: 'CogniOps Execution (Revenue)', target: 'Operational Costs (Hosting & GPU)', value: 2200 },
      { source: 'Elastic Feature Access (Revenue)', target: 'Operational Costs (Hosting & GPU)', value: 640 }
    ];

    return {
      nodes,
      links,
      totalVolumeXi: state.availableSupply + state.burnedExecutionPool + state.burnedElasticAccessPool,
      totalFiatInflowUsd: 200000,
      strategicCogsRatio: Math.round((state.mintedPoaPool / state.availableSupply) * 100) / 100
    };
  }

  /**
   * Section IV: Hybrid Pricing & Value Committee (HPVC) Proposal Submission
   */
  public submitGovernanceProposal(params: {
    title: string;
    constantKey: HpvcProposal['constantKey'];
    proposedValue: number;
    justification: string;
    proposerRole: string;
  }): HpvcProposal {
    const id = `prop_hpvc_${Date.now().toString(36)}`;
    let prev = 0;
    if (params.constantKey === 'mintingMultiplier') prev = this.mintingMultiplier();
    else if (params.constantKey === 'qualityExponent') prev = this.qualityExponent();
    else if (params.constantKey === 'xiFloor') prev = this.currentFloor().xiFloorUsd;

    const newProp: HpvcProposal = {
      id,
      title: params.title,
      constantKey: params.constantKey,
      proposedValue: params.proposedValue,
      previousValue: prev,
      justification: params.justification,
      proposerRole: params.proposerRole,
      status: 'active',
      approvals: 1,
      rejections: 0,
      createdAt: Date.now()
    };

    this.hpvcProposals.update(list => [newProp, ...list]);

    this.auditService.logEvent({
      action: 'HPVC_PROPOSAL_SUBMITTED',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: id,
      details: `HPVC proposal "${params.title}" filed for ${params.constantKey} [${prev} -> ${params.proposedValue}].`
    });

    return newProp;
  }

  public castGovernanceVote(
    proposalId: string,
    voterId: string,
    vote: 'approve' | 'reject'
  ): { success: boolean; proposal: HpvcProposal } {
    let updated: HpvcProposal | undefined;

    this.hpvcProposals.update(list =>
      list.map(p => {
        if (p.id === proposalId) {
          const app = vote === 'approve' ? p.approvals + 1 : p.approvals;
          const rej = vote === 'reject' ? p.rejections + 1 : p.rejections;
          const status = app >= 5 ? 'approved' : p.status;

          // If approved, apply the constant
          if (status === 'approved' && p.status !== 'approved') {
            if (p.constantKey === 'mintingMultiplier') this.mintingMultiplier.set(p.proposedValue);
            if (p.constantKey === 'qualityExponent') this.qualityExponent.set(p.proposedValue);
          }

          updated = { ...p, approvals: app, rejections: rej, status };
          return updated;
        }
        return p;
      })
    );

    if (!updated) {
      throw new Error(`Proposal '${proposalId}' not found.`);
    }

    this.auditService.logEvent({
      action: 'HPVC_VOTE_CAST',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      status: 'success',
      targetEntity: proposalId,
      details: `User ${voterId} voted "${vote}" on proposal ${proposalId}. Approvals: ${updated.approvals}.`
    });

    return { success: true, proposal: updated };
  }
}
