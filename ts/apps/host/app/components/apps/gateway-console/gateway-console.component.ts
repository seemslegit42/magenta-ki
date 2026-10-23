import { Component, ChangeDetectionStrategy, input, inject, signal } from '@angular/core';
import { GatewayService } from '../../../services/gateway.service';
import { PolarBillingService, LicenseValidationResult } from '../../../services/polar-billing.service';
import { XiEconomyService } from '../../../services/xi-economy.service';
import { PoAContributionParams, PoARewardResult } from '../../../models/webos.models';

@Component({
  selector: 'app-gateway-console',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-[#3EB991]">dns</span>
            <span>Control Plane Gateway, Turso Edge & The Ξ Economy</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1 font-body">Go API gateway proxy with Appwrite SAML token validation, isolated per-tenant libSQL edge queries, Polar meters, and Cognitive Operations (Ξ) monetization.</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs px-2.5 py-1 rounded-full bg-[#3EB991]/10 text-[#3EB991] border border-[#3EB991]/20 font-mono">
            Ξ Floor: {{ xi.currentFloor().xiFloorUsd }} USD
          </span>
          <span class="text-xs px-2.5 py-1 rounded-full bg-[#6A0DAD]/20 text-[#20B2AA] border border-[#20B2AA]/30 font-mono">
            Operator: {{ xi.getCustomerXiBalance('usr_operator_7842') }} Ξ
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center space-x-2 border-b border-white/10 pb-2 text-xs font-mono">
        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-[#3EB991]]="activeTab() === 'xi'"
          [class.text-[#002116]]="activeTab() === 'xi'"
          [class.font-bold]="activeTab() === 'xi'"
          [class.text-[#8C94A8]]="activeTab() !== 'xi'"
          (click)="activeTab.set('xi')">
          <span class="material-icons text-sm">psychology</span>
          <span>The Ξ Economy & CogniOps (Blueprint)</span>
        </button>

        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-[#3EB991]]="activeTab() === 'polar'"
          [class.text-[#002116]]="activeTab() === 'polar'"
          [class.font-bold]="activeTab() === 'polar'"
          [class.text-[#8C94A8]]="activeTab() !== 'polar'"
          (click)="activeTab.set('polar')">
          <span class="material-icons text-sm">toll</span>
          <span>Polar Usage Meters & Billing ({{ polar.meters().length }})</span>
        </button>

        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-[#3EB991]]="activeTab() === 'turso'"
          [class.text-[#002116]]="activeTab() === 'turso'"
          [class.font-bold]="activeTab() === 'turso'"
          [class.text-[#8C94A8]]="activeTab() !== 'turso'"
          (click)="activeTab.set('turso')">
          <span class="material-icons text-sm">terminal</span>
          <span>libSQL Edge Console</span>
        </button>

        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-[#3EB991]]="activeTab() === 'logs'"
          [class.text-[#002116]]="activeTab() === 'logs'"
          [class.font-bold]="activeTab() === 'logs'"
          [class.text-[#8C94A8]]="activeTab() !== 'logs'"
          (click)="activeTab.set('logs')">
          <span class="material-icons text-sm">security</span>
          <span>Gateway Audit Stream</span>
        </button>
      </div>

      <!-- Tab: The Ξ (Xi) Economy & CogniOps Blueprint Cockpit -->
      @if (activeTab() === 'xi') {
        <div class="space-y-6">
          <!-- Overview KPI Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">CogniOps Cost Floor (Ξ_Floor)</p>
              <p class="text-2xl font-display font-bold text-[#3EB991] mt-1">{{ xi.currentFloor().xiFloorUsd }} USD</p>
              <p class="text-[10px] text-[#8C94A8] mt-1 font-mono">Peg: 1 Ξ = 1 CAD (Stability Guarantee)</p>
            </div>
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">Total Available Ξ Pool</p>
              <p class="text-2xl font-display font-bold text-white mt-1">{{ xi.ledger().availableSupply.toLocaleString() }} Ξ</p>
              <p class="text-[10px] text-[#20B2AA] mt-1 font-mono">Circulating Monetary Reserve</p>
            </div>
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">Burned Execution (Revenue)</p>
              <p class="text-2xl font-display font-bold text-[#E0218A] mt-1">{{ xi.ledger().burnedExecutionPool.toLocaleString() }} Ξ</p>
              <p class="text-[10px] text-[#8C94A8] mt-1 font-mono">Recognized SaaS Revenue</p>
            </div>
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">PoA Minted (Strategic COGS)</p>
              <p class="text-2xl font-display font-bold text-[#20B2AA] mt-1">{{ xi.ledger().mintedPoaPool.toLocaleString() }} Ξ</p>
              <p class="text-[10px] text-[#3EB991] mt-1 font-mono">RSI & Model Lift Investment</p>
            </div>
          </div>

          <!-- Section 1 & Section 3: COGS Breakdown + Proof-of-Attribution Engine -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 1.1 COGS Floor Model -->
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                  <span class="material-icons text-xs text-[#3EB991]">calculate</span>
                  <span>1.1 CogniOps Floor Cost Decomposition</span>
                </h3>
                <span class="text-[10px] font-mono text-[#8C94A8]">Ξ_Floor = ∑(ω_i · C_i)</span>
              </div>

              <div class="space-y-2 text-xs font-mono">
                <div class="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                  <div>
                    <p class="text-white">Infrastructure / Hosting (C_Infra)</p>
                    <p class="text-[10px] text-[#8C94A8]">Normalized GPU-Second (N-GPS) | Weight: 25%</p>
                  </div>
                  <span class="text-[#3EB991] font-bold">{{ xi.currentFloor().components.cInfra }} USD/s</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                  <div>
                    <p class="text-white">Agent Inference Execution (C_Exec)</p>
                    <p class="text-[10px] text-[#8C94A8]">Agent Steps (Complexity Adjusted) | Weight: 40%</p>
                  </div>
                  <span class="text-[#3EB991] font-bold">{{ xi.currentFloor().components.cExec }} USD/step</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                  <div>
                    <p class="text-white">Model Alignment & Fine-Tuning (C_Align)</p>
                    <p class="text-[10px] text-[#8C94A8]">Pro-rated Alignment Cost (PAC: LoRA/DPO) | Weight: 20%</p>
                  </div>
                  <span class="text-[#3EB991] font-bold">{{ xi.currentFloor().components.cAlign }} USD/epoch</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                  <div>
                    <p class="text-white">Data Quality & Validation (C_Valid)</p>
                    <p class="text-[10px] text-[#8C94A8]">Validator Consensus Rate (VCR) | Weight: 15%</p>
                  </div>
                  <span class="text-[#3EB991] font-bold">{{ xi.currentFloor().components.cValid }} USD/chk</span>
                </div>
              </div>

              <!-- CogniOps Execution Burner -->
              <div class="p-3 rounded-lg bg-[#3EB991]/10 border border-[#3EB991]/20 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-display font-semibold text-white">Execute CogniOps Agent Step</span>
                  <span class="text-[11px] font-mono text-[#3EB991]">{{ xi.getCustomerXiBalance('usr_operator_7842') }} Ξ available</span>
                </div>
                <button
                  class="w-full px-3 py-2 rounded-lg bg-[#3EB991] hover:bg-[#3EB991]/80 text-[#002116] text-xs font-bold font-mono transition-colors flex items-center justify-center space-x-1"
                  (click)="executeCogniOp()">
                  <span class="material-icons text-xs">local_fire_department</span>
                  <span>Burn 25 Ξ (Execute Agentic Coordination & Recognize Revenue)</span>
                </button>
              </div>
            </div>

            <!-- 3.2 Proof-of-Attribution (PoA) Engine -->
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                  <span class="material-icons text-xs text-[#20B2AA]">auto_awesome</span>
                  <span>3.2 Proof-of-Attribution (PoA) Reward Engine</span>
                </h3>
                <span class="text-[10px] font-mono text-[#8C94A8]">R_Ξ = M_Ξ · N_k · (F_k)^α · E_data</span>
              </div>

              <div class="space-y-3 font-mono text-xs">
                <div class="grid grid-cols-3 gap-2">
                  <label class="block">
                    <span class="text-[10px] text-[#8C94A8] block mb-1">Dataset Size (N_k)</span>
                    <input
                      type="number"
                      class="w-full bg-[#0E1015] border border-white/10 rounded p-1.5 text-white"
                      [value]="poaInput().datasetWeightNk" (input)="updatePoa({ datasetWeightNk: +$any($event.target).value })" />
                  </label>
                  <label class="block">
                    <span class="text-[10px] text-[#8C94A8] block mb-1">DPO Score (F_k [0-1])</span>
                    <input
                      type="number"
                      step="0.05"
                      class="w-full bg-[#0E1015] border border-white/10 rounded p-1.5 text-white"
                      [value]="poaInput().qualityFactorFk" (input)="updatePoa({ qualityFactorFk: +$any($event.target).value })" />
                  </label>
                  <label class="block">
                    <span class="text-[10px] text-[#8C94A8] block mb-1">Model Lift (E_data)</span>
                    <input
                      type="number"
                      step="0.05"
                      class="w-full bg-[#0E1015] border border-white/10 rounded p-1.5 text-white"
                      [value]="poaInput().efficacyImpactEdata" (input)="updatePoa({ efficacyImpactEdata: +$any($event.target).value })" />
                  </label>
                </div>

                <div class="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] space-y-1">
                  <div class="flex justify-between text-[#8C94A8]">
                    <span>Minting Multiplier (M_Ξ):</span>
                    <span class="text-white">{{ xi.constants().mintingMultiplier }}</span>
                  </div>
                  <div class="flex justify-between text-[#8C94A8]">
                    <span>Quality Exponent (α):</span>
                    <span class="text-white">{{ xi.constants().qualityExponent }}</span>
                  </div>
                </div>

                <button
                  class="w-full px-3 py-2 rounded-lg bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#00201E] text-xs font-bold font-mono transition-colors flex items-center justify-center space-x-1"
                  (click)="mintPoaReward()">
                  <span class="material-icons text-xs">token</span>
                  <span>Calculate & Mint Strategic PoA Reward (R_Ξ)</span>
                </button>

                @if (lastPoaResult(); as res) {
                  <div class="p-2.5 rounded bg-[#20B2AA]/10 border border-[#20B2AA]/30 text-[11px] text-[#20B2AA] font-mono space-y-1">
                    <p class="font-bold text-white">Awarded: +{{ res.rewardXi }} Ξ</p>
                    <p class="text-[10px] text-[#8C94A8] break-all">{{ res.calculationBreakdown }}</p>
                    <p class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#20B2AA]/20 inline-block font-bold">Strategic COGS Investment</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Section 2: Hybrid SaaS Pricing & Overage Upgrade Advisor -->
          <div class="bg-[#151922] border border-white/10 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                <span class="material-icons text-xs text-[#6A0DAD]">tune</span>
                <span>2.2 Hybrid Tiered Overage & Upgrade Threshold Advisor (U_upgrade)</span>
              </h3>
              <span class="text-[10px] font-mono text-[#8C94A8]">Behavioral Upgrade Incentive Formula</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div class="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-white font-display">Starter / Base</span>
                  <span class="px-2 py-0.5 rounded bg-white/5 text-[#8C94A8] text-[10px]">50 USD/mo</span>
                </div>
                <p class="text-[11px] text-[#8C94A8]">1,000 Ξ bundled quota</p>
                <p class="text-[11px] text-[#FF4D6D]">Overage: 0.08 USD / Ξ</p>
                <div class="pt-2 text-[10px] text-[#8C94A8] border-t border-white/5">
                  Standard Agent Inference & basic contribution track.
                </div>
              </div>

              <div class="p-4 rounded-xl bg-[#6A0DAD]/10 border border-[#6A0DAD]/40 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-white font-display">Professional</span>
                  <span class="px-2 py-0.5 rounded bg-[#6A0DAD]/30 text-[#20B2AA] text-[10px]">180 USD/mo</span>
                </div>
                <p class="text-[11px] text-[#20B2AA]">4,000 Ξ bundled quota</p>
                <p class="text-[11px] text-[#3EB991]">Overage: 0.05 USD / Ξ</p>
                <div class="pt-2 text-[10px] text-[#8C94A8] border-t border-white/5">
                  Optimal upgrade threshold: <span class="text-[#3EB991] font-bold">5,333 Ξ</span>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-white font-display">Enterprise</span>
                  <span class="px-2 py-0.5 rounded bg-white/5 text-[#8C94A8] text-[10px]">750 USD/mo</span>
                </div>
                <p class="text-[11px] text-[#8C94A8]">20,000 Ξ bundled quota</p>
                <p class="text-[11px] text-[#3EB991]">Overage: 0.03 USD / Ξ</p>
                <div class="pt-2 text-[10px] text-[#8C94A8] border-t border-white/5">
                  Dedicated Fine-Tuning instance & HPVC Proxy Voting.
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Sankey Economic Flow & HPVC Parameter Governance -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 4.3 Sankey Flow Nodes -->
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
              <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                <span class="material-icons text-xs text-[#20B2AA]">alt_route</span>
                <span>4.3 Ξ Economic Flow Topology (Sankey Map)</span>
              </h3>

              <div class="space-y-2 font-mono text-[11px]">
                <div class="p-2.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                  <span class="text-white">Customer Payments (Fiat Inflow)</span>
                  <span class="text-[#3EB991] font-bold">200,000 USD → Available Ξ Pool</span>
                </div>
                <div class="p-2.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                  <span class="text-white">Proof-of-Attribution Rewards (Minted)</span>
                  <span class="text-[#20B2AA] font-bold">45,000 Ξ → Strategic COGS</span>
                </div>
                <div class="p-2.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                  <span class="text-white">CogniOps Execution (Burned)</span>
                  <span class="text-[#E0218A] font-bold">128,500 Ξ → Recognized Revenue</span>
                </div>
                <div class="p-2.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                  <span class="text-white">Elastic Feature Access (Burned)</span>
                  <span class="text-[#E0218A] font-bold">34,200 Ξ → Recognized Revenue</span>
                </div>
                <div class="p-2.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                  <span class="text-white">Terminal Infrastructure Costs</span>
                  <span class="text-[#FF4D6D] font-bold">2,840.50 USD → GPU / Cloud Ops</span>
                </div>
              </div>
            </div>

            <!-- 4.1 HPVC Governance -->
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                  <span class="material-icons text-xs text-[#3EB991]">how_to_vote</span>
                  <span>4.1 Hybrid Pricing & Value Committee (HPVC)</span>
                </h3>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3EB991]/10 text-[#3EB991]">Decentralized Oversight</span>
              </div>

              <div class="space-y-3 font-mono text-xs">
                @for (prop of xi.proposals(); track prop.id) {
                  <div class="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                    <div class="flex justify-between items-start">
                      <span class="font-display font-semibold text-xs text-white">{{ prop.title }}</span>
                      <span
                        class="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold"
                        [class.bg-[#3EB991]/20]="prop.status === 'approved'"
                        [class.text-[#3EB991]]="prop.status === 'approved'"
                        [class.bg-[#6A0DAD]/20]="prop.status === 'active'"
                        [class.text-[#20B2AA]]="prop.status === 'active'">
                        {{ prop.status }}
                      </span>
                    </div>
                    <p class="text-[10px] text-[#8C94A8]">{{ prop.justification }}</p>
                    <div class="flex items-center justify-between pt-1 border-t border-white/5">
                      <span class="text-[10px] text-[#3EB991]">Approvals: {{ prop.approvals }}</span>
                      @if (prop.status === 'active') {
                        <button
                          class="px-2.5 py-1 rounded bg-[#3EB991] hover:bg-[#3EB991]/80 text-[#002116] text-[10px] font-bold"
                          (click)="voteOnProposal(prop.id, 'approve')">
                          Cast Proxy Vote
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab: Polar Usage Meters & Billing -->
      @if (activeTab() === 'polar') {
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">Active Usage Meters</p>
              <p class="text-2xl font-display font-bold text-white mt-1">{{ polar.meters().length }}</p>
              <p class="text-[10px] text-[#3EB991] mt-1 font-mono">Filtering & Aggregating</p>
            </div>
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">Cost Insights Ingested</p>
              <p class="text-2xl font-display font-bold text-[#3EB991] mt-1">{{ (polar.totalTrackedCostCents() / 100).toFixed(4) }} $</p>
              <p class="text-[10px] text-[#8C94A8] mt-1 font-mono">Sub-cent precision (12 decimals)</p>
            </div>
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">Operator AI Token Balance</p>
              <p class="text-2xl font-display font-bold text-[#20B2AA] mt-1">
                {{ (polar.customerState('usr_operator_7842')?.meters?.[0]?.balance || 0).toLocaleString() }}
              </p>
              <p class="text-[10px] text-[#8C94A8] mt-1 font-mono">Credited with Rollover</p>
            </div>
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4">
              <p class="text-[11px] font-mono text-[#8C94A8]">Active License Keys</p>
              <p class="text-2xl font-display font-bold text-[#E0218A] mt-1">{{ polar.licenseKeys().length }}</p>
              <p class="text-[10px] text-[#8C94A8] mt-1 font-mono">Status: Granted</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                  <span class="material-icons text-xs text-[#3EB991]">speed</span>
                  <span>Active Polar Usage Meters</span>
                </h3>
                <button
                  class="px-2.5 py-1 rounded bg-[#3EB991]/20 hover:bg-[#3EB991]/30 text-[#3EB991] text-xs font-mono transition-colors flex items-center space-x-1"
                  (click)="simulateAiUsageIngest()">
                  <span class="material-icons text-xs">bolt</span>
                  <span>Ingest 1,500 Tokens</span>
                </button>
              </div>

              <div class="space-y-3">
                @for (m of polar.meters(); track m.id) {
                  <div class="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-display font-semibold text-xs text-white">{{ m.name }}</span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#20B2AA] uppercase">{{ m.unit }}</span>
                    </div>
                    <div class="text-[11px] font-mono text-[#8C94A8] grid grid-cols-2 gap-2">
                      <div><span class="text-white/40">Aggregation:</span> {{ m.aggregation.func }}({{ m.aggregation.property || 'count' }})</div>
                      <div><span class="text-white/40">Filter:</span> {{ m.filter.clauses[0].property }} {{ m.filter.clauses[0].operator }} '{{ m.filter.clauses[0].value }}'</div>
                      <div><span class="text-white/40">Events Count:</span> <span class="text-[#3EB991]">{{ m.totalEventsProcessed }}</span></div>
                      <div><span class="text-white/40">Meter ID:</span> {{ m.id }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
              <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
                <span class="material-icons text-xs text-[#E0218A]">shopping_cart</span>
                <span>Checkout Sessions & License Validator</span>
              </h3>

              <div class="space-y-3 font-mono text-xs">
                <div class="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                  <p class="text-[11px] font-display font-semibold text-white">Generate Hosted Checkout Link</p>
                  <p class="text-[10px] text-[#8C94A8]">Generates an ad-hoc session URL embedding the Merchant of Record tax engine.</p>
                  <button
                    class="px-3.5 py-1.5 rounded-lg bg-[#6A0DAD] hover:bg-[#E0218A] text-white text-xs font-mono transition-colors flex items-center space-x-1"
                    (click)="generateCheckout()">
                    <span class="material-icons text-xs">link</span>
                    <span>Generate Checkout Link</span>
                  </button>
                  @if (latestCheckoutUrl()) {
                    <div class="p-2 rounded bg-white/5 text-[10px] text-[#3EB991] break-all border border-[#3EB991]/30">
                      {{ latestCheckoutUrl() }}
                    </div>
                  }
                </div>

                <div class="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                  <p class="text-[11px] font-display font-semibold text-white">Validate License Key (Polar API)</p>
                  <div class="flex items-center space-x-2">
                    <input
                      class="flex-1 bg-[#0E1015] border border-white/10 rounded p-1.5 text-xs text-white"
                      [value]="licenseKeyToTest()" (input)="licenseKeyToTest.set($any($event.target).value)" />
                    <button
                      class="px-3 py-1.5 rounded bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#00201E] font-bold text-xs"
                      (click)="testLicenseKey()">
                      Verify
                    </button>
                  </div>
                  @if (licenseResult()) {
                    <p class="text-[10px]" [class.text-[#3EB991]]="licenseResult()?.valid" [class.text-[#FF4D6D]]="!licenseResult()?.valid">
                      Result: {{ licenseResult()?.status }} | Activations: {{ licenseResult()?.activationsCount }}
                    </p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab: libSQL Edge Console -->
      @if (activeTab() === 'turso') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
            <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
              <span class="material-icons text-xs text-[#20B2AA]">code</span>
              <span>libSQL Edge Query Editor</span>
            </h3>

            <textarea
              class="w-full h-32 bg-[#0E1015] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#3EB991]"
              [value]="sqlQuery()" (input)="sqlQuery.set($any($event.target).value)"></textarea>

            <button
              class="px-4 py-2 rounded-lg bg-[#3EB991] hover:bg-[#3EB991]/80 text-[#002116] text-xs font-semibold transition-colors flex items-center space-x-1 shadow-md"
              (click)="runQuery()">
              <span class="material-icons text-xs">play_arrow</span>
              <span>Execute libSQL Query</span>
            </button>

            @if (queryResult(); as res) {
              <div class="mt-4 space-y-2 overflow-x-auto">
                <table class="w-full text-left text-xs font-mono">
                  <thead>
                    <tr class="border-b border-white/10 text-[#8C94A8]">
                      @for (col of res.columns; track col) {
                        <th class="pb-2 pr-4">{{ col }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of res.rows; track row) {
                      <tr class="border-b border-white/5 text-white">
                        @for (cell of row; track cell) {
                          <td class="py-2 pr-4">{{ cell }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
            <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
              <span class="material-icons text-xs text-[#20B2AA]">speed</span>
              <span>Tenant Edge Routing Metadata</span>
            </h3>
            <div class="p-3 rounded-lg bg-black/30 border border-white/5 font-mono text-xs space-y-2">
              <div><span class="text-[#8C94A8]">Tenant ID:</span> <span class="text-[#20B2AA]">{{ gateway.currentTenant().tenantId }}</span></div>
              <div><span class="text-[#8C94A8]">User ID:</span> <span class="text-white">{{ gateway.currentTenant().userId }}</span></div>
              <div><span class="text-[#8C94A8]">libSQL Edge URL:</span> <span class="text-[#3EB991] break-all">{{ gateway.currentTenant().tursoConnUrl }}</span></div>
              <div><span class="text-[#8C94A8]">Roles:</span> <span class="text-[#E0218A]">{{ gateway.currentTenant().roles.join(', ') }}</span></div>
            </div>
          </div>
        </div>
      }

      <!-- Tab: Gateway Request Audit Stream -->
      @if (activeTab() === 'logs') {
        <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
            <span class="material-icons text-xs text-[#E0218A]">security</span>
            <span>Go Gateway & Polar Webhook Audit Stream</span>
          </h3>

          <div class="max-h-80 overflow-y-auto space-y-2 font-mono text-[11px]">
            @for (log of gatewayLogs(); track log.timestamp + log.path) {
              <div class="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                <div class="flex items-center space-x-2 overflow-hidden">
                  <span class="px-1.5 py-0.5 rounded bg-[#3EB991]/20 text-[#3EB991] font-bold text-[10px]">{{ log.method }}</span>
                  <span class="text-white truncate">{{ log.path }}</span>
                </div>
                <div class="flex items-center space-x-3 text-[#8C94A8] shrink-0">
                  <span class="text-[#3EB991]">{{ log.latencyMs }}ms</span>
                  <span>{{ log.timestamp }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class GatewayConsoleComponent {
  readonly pid = input.required<string>();
  protected gateway = inject(GatewayService);
  protected polar = inject(PolarBillingService);
  protected xi = inject(XiEconomyService);

  protected activeTab = signal<'xi' | 'polar' | 'turso' | 'logs'>('xi');
  protected sqlQuery = signal('SELECT config_key, config_val, updated_at FROM desktop_state WHERE user_id = "usr_operator_7842";');
  protected queryResult = signal<{ columns: string[]; rows: unknown[][] } | null>(null);
  protected gatewayLogs = this.gateway.logs;

  protected latestCheckoutUrl = signal<string | null>(null);
  protected licenseKeyToTest = signal('POLAR_9A8F-42E1-BC77-0912');
  protected licenseResult = signal<LicenseValidationResult | null>(null);

  protected poaInput = signal<PoAContributionParams>({
    contributorId: 'usr_operator_7842',
    datasetWeightNk: 150,
    qualityFactorFk: 0.95,
    efficacyImpactEdata: 1.35
  });
  protected lastPoaResult = signal<PoARewardResult | null>(null);

  public runQuery(): void {
    const res = this.gateway.queryEdgeDatabase(this.sqlQuery());
    this.queryResult.set(res);
  }

  public simulateAiUsageIngest(): void {
    this.polar.ingestEvents([
      {
        name: 'ai_usage',
        external_customer_id: 'usr_operator_7842',
        metadata: {
          model: 'gemini-2.5-flash',
          total_tokens: 1500,
          prompt_tokens: 1000,
          completion_tokens: 500,
          _cost: { amount: 3.125, currency: 'usd' }
        }
      }
    ]);
  }

  public generateCheckout(): void {
    const session = this.polar.createCheckoutSession({
      products: ['prod_core_kernel'],
      externalCustomerId: 'usr_operator_7842',
      customerEmail: 'operator@verdigris.cloud',
      successUrl: 'https://verdigris.cloud/confirmation?checkout_id={CHECKOUT_ID}'
    });
    this.latestCheckoutUrl.set(session.url);
  }

  public testLicenseKey(): void {
    const res = this.polar.validateLicenseKey(this.licenseKeyToTest(), 'inst_node_mac_01');
    this.licenseResult.set(res);
  }

  public mintPoaReward(): void {
    const res = this.xi.calculateAndMintPoaReward(this.poaInput());
    this.lastPoaResult.set(res);
  }

  public executeCogniOp(): void {
    this.xi.burnCogniOps({
      customerId: 'usr_operator_7842',
      xiUnits: 25,
      reason: 'Agentic Workflow Coordination & Model Inference',
      isElasticAccess: false
    });
  }

  public voteOnProposal(proposalId: string, vote: 'approve' | 'reject'): void {
    this.xi.castGovernanceVote(proposalId, 'usr_operator_7842', vote);
  }

  updatePoa(patch: Partial<PoAContributionParams>): void {
    this.poaInput.update((v) => ({ ...v, ...patch }));
  }
}
