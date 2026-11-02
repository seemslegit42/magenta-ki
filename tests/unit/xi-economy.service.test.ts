import { describe, it, expect, beforeEach } from 'bun:test';
import { XiEconomyService } from '../../src/app/services/xi-economy.service';
import { CogniOpsCogsBreakdown, PoAContributionParams } from '../../src/app/models/webos.models';

describe('XiEconomyService', () => {
  let service: XiEconomyService;

  beforeEach(() => {
    service = new XiEconomyService();
  });

  it('should initialize with standard CogniOps floor cost components and fiat peg', () => {
    const floor = service.currentFloor();
    expect(floor.xiFloorUsd).toBeGreaterThan(0);
    expect(floor.fiatPegCurrency).toBe('CAD');
    expect(floor.components.cInfra).toBeGreaterThan(0);
    expect(floor.components.cExec).toBeGreaterThan(0);
    expect(floor.components.cAlign).toBeGreaterThan(0);
    expect(floor.components.cValid).toBeGreaterThan(0);
  });

  it('should calculate weighted Xi Floor cost dynamically when COGS components update', () => {
    const customBreakdown: CogniOpsCogsBreakdown = {
      cInfra: 0.012,
      wInfra: 0.25,
      cExec: 0.024,
      wExec: 0.40,
      cAlign: 0.035,
      wAlign: 0.20,
      cValid: 0.008,
      wValid: 0.15
    };

    const calculatedFloor = service.calculateFloorCost(customBreakdown);
    // (0.012 * 0.25) + (0.024 * 0.40) + (0.035 * 0.20) + (0.008 * 0.15)
    // 0.003 + 0.0096 + 0.007 + 0.0012 = 0.0208
    expect(calculatedFloor).toBeCloseTo(0.0208, 4);
  });

  it('should calculate optimal upgrade threshold U_upgrade for hybrid tiered plans', () => {
    // Professional plan vs Base plan:
    // Starter: Base $50, Quota 1000, Overage $0.08
    // Pro: Base $180, Quota 4000, Overage $0.05
    // Threshold: 1000 + (130 / 0.03) = 5333 units
    const threshold = service.calculateUpgradeThreshold('starter', 'professional');
    expect(threshold.optimalUpgradeXiUnits).toBe(5333);
    expect(threshold.shouldRecommendUpgrade(6000)).toBe(true);
    expect(threshold.shouldRecommendUpgrade(3500)).toBe(false);
  });

  it('should execute Proof-of-Attribution (PoA) reward formula R_Xi = M_Xi * N_k * (F_k)^alpha * E_data', () => {
    const contribution: PoAContributionParams = {
      contributorId: 'usr_operator_7842',
      datasetWeightNk: 120,
      qualityFactorFk: 0.95, // High DPO preference score
      efficacyImpactEdata: 1.45 // 45% lift in model counterfactual benchmark
    };

    const rewardResult = service.calculateAndMintPoaReward(contribution);
    expect(rewardResult.rewardXi).toBeGreaterThan(0);
    expect(rewardResult.classification).toBe('strategic_cogs_investment');
    expect(service.ledger().mintedPoaPool).toBeGreaterThanOrEqual(rewardResult.rewardXi);
  });

  it('should burn Xi on CogniOps execution and elastic feature gating', () => {
    const initialElastic = service.ledger().burnedElasticAccessPool;
    const initialBalance = service.getCustomerXiBalance('usr_operator_7842');

    const burnResult = service.burnCogniOps({
      customerId: 'usr_operator_7842',
      xiUnits: 50,
      reason: 'Multi-Agent DPO Fine-Tuning Execution',
      isElasticAccess: true
    });

    expect(burnResult.success).toBe(true);
    expect(burnResult.remainingBalance).toBe(initialBalance - 50);
    expect(service.ledger().burnedElasticAccessPool).toBe(initialElastic + 50);
  });

  it('should generate balanced Sankey diagram flow telemetry', () => {
    const sankey = service.generateSankeyFlow();
    expect(sankey.nodes.length).toBeGreaterThanOrEqual(7);
    expect(sankey.links.some(l => l.source.includes('Customer Payments') && l.target.includes('Available'))).toBe(true);
    expect(sankey.links.some(l => l.source.includes('Available') && l.target.includes('CogniOps Execution'))).toBe(true);
    expect(sankey.links.some(l => l.source.includes('Proof-of-Attribution') && l.target.includes('Available'))).toBe(true);
  });

  it('should record HPVC parameter governance proposals and adjust economic constants', () => {
    const proposal = service.submitGovernanceProposal({
      title: 'Adjust Minting Multiplier M_Xi to counteract COGS drop',
      constantKey: 'mintingMultiplier',
      proposedValue: 1.15,
      justification: 'Inference efficiency gain of 18% via LoRA model quantization',
      proposerRole: 'administrator'
    });

    expect(proposal.id).toContain('prop_');
    expect(proposal.status).toBe('active');

    const voteResult = service.castGovernanceVote(proposal.id, 'usr_operator_7842', 'approve');
    expect(voteResult.proposal.approvals).toBeGreaterThan(0);
  });
});
