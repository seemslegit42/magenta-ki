import { Injectable, signal } from '@angular/core';

export interface AppHubEntry {
  id: string;
  name: string;
  icon: string;
  version: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppHubService {
  private readonly registry = signal<AppHubEntry[]>([]);
  readonly entries = this.registry.asReadonly();

  register(entry: AppHubEntry): void {
    this.registry.update(items => [...items.filter(i => i.id !== entry.id), entry]);
  }
}
