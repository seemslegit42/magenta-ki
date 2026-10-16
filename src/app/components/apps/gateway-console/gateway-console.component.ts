import { Component, Input, inject, signal } from '@angular/core';
import { GatewayService } from '../../../services/gateway.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gateway-console',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-[#3EB991]">dns</span>
            <span>Control Plane Gateway & Turso Edge DB</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1">Go API gateway proxy with Appwrite SAML token validation and isolated per-tenant libSQL edge queries.</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs px-2.5 py-1 rounded-full bg-[#3EB991]/10 text-[#3EB991] border border-[#3EB991]/20 font-mono">
            Proxy Latency: 3.4ms
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Turso Edge SQL Query Console -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
            <span class="material-icons text-xs text-[#20B2AA]">code</span>
            <span>libSQL Edge Query Editor</span>
          </h3>

          <textarea
            class="w-full h-32 bg-[#0E1015] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#3EB991]"
            [(ngModel)]="sqlQuery"></textarea>

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

        <!-- Gateway Request Audit Stream -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
            <span class="material-icons text-xs text-[#E0218A]">security</span>
            <span>Go Gateway Request Audit Stream</span>
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
      </div>
    </div>
  `
})
export class GatewayConsoleComponent {
  @Input({ required: true }) pid!: string;
  private gateway = inject(GatewayService);

  protected sqlQuery = 'SELECT config_key, config_val, updated_at FROM desktop_state WHERE user_id = "usr_operator_7842";';
  protected queryResult = signal<{ columns: string[]; rows: unknown[][] } | null>(null);
  protected gatewayLogs = this.gateway.logs;

  public runQuery(): void {
    const res = this.gateway.queryEdgeDatabase(this.sqlQuery);
    this.queryResult.set(res);
  }
}
