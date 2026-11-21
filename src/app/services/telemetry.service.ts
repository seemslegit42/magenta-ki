import { Injectable, signal } from '@angular/core';

export interface SystemMetrics {
  cpu: number;
  gpu: number;
  memory: number;
  iops: number;
  security_events: number;
}

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  public readonly metrics = signal<SystemMetrics>({ cpu: 0, gpu: 0, memory: 0, iops: 0, security_events: 0 });

  constructor() {
    this.initTelemetry();
  }

  private initTelemetry() {
    const evtSource = new EventSource('/api/telemetry/sse');
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.metrics.set(data);
      } catch (e) {
        console.error('Failed to parse telemetry data', e);
      }
    };
  }
}
