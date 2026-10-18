import { describe, it, expect, beforeEach } from 'bun:test';
import { AvfService } from '../../src/app/services/avf.service';

describe('AvfService (The Agentic Value Framework)', () => {
  let service: AvfService;

  beforeEach(() => {
    service = new AvfService();
  });

  it('should initialize with Table 3 conservative baseline parameters', () => {
    const p = service.params();
    expect(p.baseValueUav).toBe(100);
    expect(p.initialAgents).toBe(50);
    expect(p.annualAgentGrowthPct).toBe(100);
    expect(p.compoundingMultiplier).toBe(1.05);
    expect(p.initialAdoptionFactor).toBe(0.05);
    expect(p.yearsToFullAdoption).toBe(7);
  });

  it('should produce the exact Table 3 multi-year revenue projections', () => {
    const proj = service.fiveYearProjection();
    expect(proj.length).toBe(5);

    // Verify exact Table 3 figures from the canonical blueprint
    expect(proj[0].projectedRevenue).toBe(26250);   // Year 1
    expect(proj[1].projectedRevenue).toBe(115763);  // Year 2
    expect(proj[2].projectedRevenue).toBe(364659);  // Year 3
    expect(proj[3].projectedRevenue).toBe(933968);  // Year 4
    expect(proj[4].projectedRevenue).toBe(2130511); // Year 5

    // Verify Intelligence Premium exists and grows
    expect(proj[0].intelligencePremium).toBeGreaterThan(0);
    expect(proj[4].intelligencePremium).toBeGreaterThan(proj[0].intelligencePremium);
  });

  it('should dynamically update parameters and recalculate multi-year projection', () => {
    service.updateParams({ baseValueUav: 250, initialAgents: 100 });
    const p = service.params();
    expect(p.baseValueUav).toBe(250);
    expect(p.initialAgents).toBe(100);

    const proj = service.fiveYearProjection();
    expect(proj[0].projectedRevenue).toBeGreaterThan(0);
  });

  it('should toggle emergency kill-switch for agents to mitigate unmanaged sprawl', () => {
    const initialAgents = service.agentRegistry();
    const targetAgent = initialAgents[0];
    expect(targetAgent.killSwitchEngaged).toBe(false);
    expect(targetAgent.status).toBe('active');

    // Engage kill switch
    service.toggleAgentKillSwitch(targetAgent.id);
    const lockedAgent = service.agentRegistry().find(a => a.id === targetAgent.id);
    expect(lockedAgent?.killSwitchEngaged).toBe(true);
    expect(lockedAgent?.status).toBe('locked');

    // Disengage kill switch
    service.toggleAgentKillSwitch(targetAgent.id);
    const unlockedAgent = service.agentRegistry().find(a => a.id === targetAgent.id);
    expect(unlockedAgent?.killSwitchEngaged).toBe(false);
    expect(unlockedAgent?.status).toBe('active');
  });

  it('should add custom UAV definitions and track cumulative economic value', () => {
    const initialCount = service.uavDefinitions().length;
    service.addUavDefinition({
      name: 'Maritime Container Turnaround',
      domain: 'logistics',
      description: 'Autonomous port demurrage mitigation and gate dispatch.',
      baseValue: 350,
      measurementUnit: 'Per Container Dispatched',
      verificationProof: 'Port Authority EDI 301 Invariant',
      compoundingRate: 19.5,
      humanAlternativeCost: 800
    });

    const updated = service.uavDefinitions();
    expect(updated.length).toBe(initialCount + 1);
    expect(updated[0].name).toBe('Maritime Container Turnaround');
    expect(service.totalValueCreated()).toBeGreaterThan(0);
    expect(service.totalHumanSavings()).toBeGreaterThan(0);
  });

  it('should export valid JSON and CSV reports with all formula variables', () => {
    const jsonStr = service.exportJsonReport();
    const parsed = JSON.parse(jsonStr);
    expect(parsed.manifest).toContain('Agentic Value Framework');
    expect(parsed.formula).toBe('Revenue = V_base * N_agents * M_c * F_adopt');
    expect(parsed.projections.length).toBe(5);

    const csvStr = service.exportCsvReport();
    expect(csvStr).toContain('Year,BaseValue_USD,AgentCount,CompoundingMultiplier_Mc');
    expect(csvStr).toContain('2130511');
  });
});
