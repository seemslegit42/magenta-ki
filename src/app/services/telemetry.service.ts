import { Injectable, signal } from '@angular/core';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SystemMetrics {
  cpu: number;
  gpu: number;
  memory: number;
  iops: number;
  security_events: number;
}

export interface MetricHistoryPoint {
  timestamp: string;
  cpu: number;
  gpu: number;
  memory: number;
}

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly platformId = inject(PLATFORM_ID);
  public readonly metrics = signal<SystemMetrics>({ cpu: 42.4, gpu: 28.1, memory: 56.8, iops: 1420, security_events: 0 });
  public readonly history = signal<MetricHistoryPoint[]>([
    { timestamp: '12:00:00', cpu: 38, gpu: 22, memory: 52 },
    { timestamp: '12:00:04', cpu: 41, gpu: 26, memory: 54 },
    { timestamp: '12:00:08', cpu: 44, gpu: 30, memory: 55 },
    { timestamp: '12:00:12', cpu: 39, gpu: 24, memory: 53 },
    { timestamp: '12:00:16', cpu: 42, gpu: 28, memory: 56 },
  ]);
  public readonly isLiveConnected = signal<boolean>(false);

  constructor() {
    this.initTelemetry();
  }

  private initTelemetry() {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return;
    }

    try {
      if (typeof EventSource !== 'undefined') {
        const evtSource = new EventSource('/api/telemetry/sse');
        evtSource.onopen = () => {
          this.isLiveConnected.set(true);
        };
        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.updateMetrics(data);
            this.isLiveConnected.set(true);
          } catch (e) {
            console.error('Failed to parse telemetry data', e);
          }
        };
        evtSource.onerror = () => {
          this.isLiveConnected.set(false);
          // Fallback pulse generator when server SSE is idle or disconnected
          this.startFallbackSimulation();
        };
      } else {
        this.startFallbackSimulation();
      }
    } catch {
      this.startFallbackSimulation();
    }
  }

  private simInterval: ReturnType<typeof setInterval> | null = null;
  private startFallbackSimulation() {
    if (this.simInterval) return;
    this.simInterval = setInterval(() => {
      const current = this.metrics();
      const cpu = Math.max(12, Math.min(94, current.cpu + (Math.random() * 8 - 4)));
      const gpu = Math.max(8, Math.min(96, current.gpu + (Math.random() * 10 - 5)));
      const memory = Math.max(30, Math.min(88, current.memory + (Math.random() * 4 - 2)));
      const iops = Math.floor(1200 + Math.random() * 450);
      const security_events = Math.random() > 0.95 ? 1 : 0;

      this.updateMetrics({ cpu, gpu, memory, iops, security_events });
    }, 2500);
  }

  private updateMetrics(newMetrics: SystemMetrics) {
    this.metrics.set(newMetrics);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] || '';
    this.history.update(h => {
      const updated = [...h, { timestamp: timeStr, cpu: newMetrics.cpu, gpu: newMetrics.gpu, memory: newMetrics.memory }];
      return updated.slice(-15);
    });
  }
}
