import { Component, inject } from '@angular/core';
import { TelemetryService } from '../../../services/telemetry.service';

@Component({
  selector: 'app-telemetry-dashboard',
  template: `
    <div class="p-6 bg-surface-container rounded-2xl border border-outline font-body-md text-on-surface">
      <h2 class="text-headline-sm text-magenta mb-4">SYSTEM TELEMETRY — LIVE STREAM</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-surface-dim rounded-lg">
          <div class="text-label-sm text-on-surface-variant">CPU UTILIZATION</div>
          <div class="text-headline-md">{{ telemetry.metrics().cpu.toFixed(1) }}%</div>
        </div>
        <div class="p-4 bg-surface-dim rounded-lg">
          <div class="text-label-sm text-on-surface-variant">GPU UTILIZATION</div>
          <div class="text-headline-md">{{ telemetry.metrics().gpu.toFixed(1) }}%</div>
        </div>
        <div class="p-4 bg-surface-dim rounded-lg">
          <div class="text-label-sm text-on-surface-variant">MEMORY</div>
          <div class="text-headline-md">{{ telemetry.metrics().memory.toFixed(1) }}%</div>
        </div>
        <div class="p-4 bg-surface-dim rounded-lg">
          <div class="text-label-sm text-on-surface-variant">IOPS</div>
          <div class="text-headline-md">{{ telemetry.metrics().iops }}</div>
        </div>
        <div class="col-span-2 p-4 bg-magenta-dim/20 border border-magenta rounded-lg">
          <div class="text-label-sm text-magenta">SECURITY ANOMALIES</div>
          <div class="text-headline-md text-magenta">{{ telemetry.metrics().security_events }}</div>
        </div>
      </div>
    </div>
  `
})
export class TelemetryDashboardComponent {
  protected readonly telemetry = inject(TelemetryService);
}
