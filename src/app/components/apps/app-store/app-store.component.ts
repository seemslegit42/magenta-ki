import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WindowManagerService } from '../../../services/window-manager.service';
import { NativeFederationService } from '../../../services/native-federation.service';

export interface StoreItem {
  id: string;
  name: string;
  category: 'plugin' | 'ai-model' | 'connector' | 'theme';
  icon: string;
  description: string;
  version: string;
  publisher: string;
  price: string;
  downloads: string;
  rating: number;
  installed: boolean;
}

@Component({
  selector: 'app-app-store',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full space-y-5 font-['Lexend'] text-[#F5FFFA] p-1">
      <!-- Store Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <h2 class="font-['Comfortaa'] text-2xl font-bold text-[#F5FFFA] flex items-center space-x-2.5">
            <mat-icon class="text-[#20B2AA] text-2xl">store</mat-icon>
            <span>Verdigris Enterprise Marketplace</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1 font-light">
            Acquire certified plugins, neural AI model weights, quantum cloud connectors, and executive themes.
          </p>
        </div>

        <div class="flex items-center space-x-2 text-xs">
          <div class="px-3 py-1.5 rounded-full bg-[#14161C] border border-[#20B2AA]/30 text-[#20B2AA] font-mono flex items-center space-x-1.5">
            <mat-icon class="text-sm">verified</mat-icon>
            <span>Enterprise Registry Active</span>
          </div>
        </div>
      </header>

      <!-- Search & Category Filters -->
      <section class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#12141A]/80 border border-white/10 rounded-xl p-3">
        <div class="relative flex-1">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C94A8] text-sm pointer-events-none">search</mat-icon>
          <input
            type="search"
            [formControl]="searchControl"
            placeholder="Search marketplace modules, connectors, and AI models..."
            class="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0D0E12] border border-white/10 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#20B2AA] transition-all font-['Lexend']"
          />
        </div>

        <div class="flex items-center flex-wrap gap-1.5 text-xs">
          @for (cat of categories; track cat.id) {
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer focus:outline-none"
              [class.bg-[#20B2AA]]="selectedCategory() === cat.id"
              [class.text-[#0D0E12]]="selectedCategory() === cat.id"
              [class.border-[#20B2AA]]="selectedCategory() === cat.id"
              [class.font-bold]="selectedCategory() === cat.id"
              [class.bg-[#1A1D24]]="selectedCategory() !== cat.id"
              [class.text-[#8C94A8]]="selectedCategory() !== cat.id"
              [class.border-white/10]="selectedCategory() !== cat.id"
              (click)="selectedCategory.set(cat.id)">
              <mat-icon class="text-xs">{{ cat.icon }}</mat-icon>
              <span>{{ cat.label }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Store Items Grid -->
      <div class="flex-1 overflow-y-auto pr-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of filteredItems(); track item.id) {
            <article class="flex flex-col justify-between rounded-xl bg-[rgba(18,20,26,0.8)] backdrop-blur-md border border-white/10 hover:border-[#20B2AA]/50 p-4 transition-all group shadow-md">
              <div>
                <div class="flex items-start justify-between mb-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A1D24] to-[#12141A] border border-white/10 flex items-center justify-center text-[#20B2AA] group-hover:scale-105 transition-transform shadow-inner">
                    <mat-icon class="text-2xl">{{ item.icon }}</mat-icon>
                  </div>

                  <div class="flex flex-col items-end space-y-1">
                    <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/20">
                      {{ item.category }}
                    </span>
                    <span class="text-[10px] font-mono text-[#8C94A8]">{{ item.price }}</span>
                  </div>
                </div>

                <h3 class="font-['Comfortaa'] font-semibold text-sm text-[#F5FFFA] group-hover:text-[#20B2AA] transition-colors">
                  {{ item.name }}
                </h3>
                <p class="text-[11px] text-[#8C94A8] mt-1 font-mono">By {{ item.publisher }} • v{{ item.version }}</p>
                <p class="text-xs text-[#8C94A8] mt-2 line-clamp-2 leading-relaxed">
                  {{ item.description }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div class="flex items-center space-x-2 text-[10px] text-[#8C94A8] font-mono">
                  <span>⭐ {{ item.rating }}</span>
                  <span>•</span>
                  <span>📥 {{ item.downloads }}</span>
                </div>

                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer focus:outline-none"
                  [class.bg-[#20B2AA]]="!item.installed"
                  [class.text-[#0D0E12]]="!item.installed"
                  [class.hover:bg-[#35d0c7]]="!item.installed"
                  [class.bg-emerald-500/20]="item.installed"
                  [class.text-emerald-400]="item.installed"
                  [class.border]="item.installed"
                  [class.border-emerald-500/40]="item.installed"
                  (click)="toggleInstall(item)">
                  <mat-icon class="text-sm">{{ item.installed ? 'check' : 'download' }}</mat-icon>
                  <span>{{ item.installed ? 'Installed' : 'Acquire' }}</span>
                </button>
              </div>
            </article>
          }
        </div>
      </div>

      <!-- Footer Info -->
      <footer class="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8C94A8]">
        <div class="flex items-center space-x-2 font-mono">
          <mat-icon class="text-sm text-[#20B2AA]">security</mat-icon>
          <span>All packages cryptographically signed and scanned by RBAC Sentinel.</span>
        </div>
        <span class="font-mono">Verdigris OS App Store v2.4</span>
      </footer>
    </div>
  `
})
export class AppStoreComponent {
  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<string>('all');

  constructor() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
    });
  }

  protected readonly categories = [
    { id: 'all', label: 'All Modules', icon: 'grid_view' },
    { id: 'plugin', label: 'Enterprise Plugins', icon: 'extension' },
    { id: 'ai-model', label: 'Neural AI Models', icon: 'psychology' },
    { id: 'connector', label: 'Cloud Connectors', icon: 'cloud_sync' },
    { id: 'theme', label: 'Executive Themes', icon: 'palette' }
  ];

  protected readonly storeItems = signal<StoreItem[]>([
    {
      id: 'quantum-mesh-plugin',
      name: 'Quantum Mesh Accelerator',
      category: 'plugin',
      icon: 'hub',
      description: 'Zero-latency multi-region sync plugin for real-time edge node orchestration across global clusters.',
      version: '2.4.1',
      publisher: 'ΛΞV Core Labs',
      price: 'Free',
      downloads: '14.2k',
      rating: 4.9,
      installed: true
    },
    {
      id: 'gemini-ultra-weights',
      name: 'Gemini 2.5 Pro Neural Weights',
      category: 'ai-model',
      icon: 'neurology',
      description: 'Local reasoning model weights optimized for enterprise code generation and autonomous document synthesis.',
      version: '2.5.0',
      publisher: 'Google Cloud AI',
      price: 'Enterprise',
      downloads: '48.9k',
      rating: 5.0,
      installed: true
    },
    {
      id: 'appwrite-sync-connector',
      name: 'Appwrite Enterprise TablesSync',
      category: 'connector',
      icon: 'database',
      description: 'Direct high-throughput synchronization bridge for Appwrite Cloud and self-hosted PostgreSQL clusters.',
      version: '1.8.4',
      publisher: 'Appwrite Inc',
      price: 'Free',
      downloads: '32.1k',
      rating: 4.8,
      installed: false
    },
    {
      id: 'verdigris-obsidian-theme',
      name: 'Obsidian Magenta VIP Theme',
      category: 'theme',
      icon: 'palette',
      description: 'Ultra-dark Vantablack glassmorphism aesthetic with high-intensity #E0218A magenta chromatic glows.',
      version: '2.4.0',
      publisher: 'Verdigris UX',
      price: 'Free',
      downloads: '89.5k',
      rating: 4.9,
      installed: true
    },
    {
      id: 'turso-edge-connector',
      name: 'Turso libSQL Edge Bridge',
      category: 'connector',
      icon: 'bolt',
      description: 'Distributed SQLite edge replica connector for sub-millisecond read queries across 30+ regions.',
      version: '0.9.2',
      publisher: 'ChiselStrike',
      price: 'Free',
      downloads: '19.4k',
      rating: 4.7,
      installed: false
    },
    {
      id: 'compliance-auditor',
      name: 'SOC2 & HIPAA Sentinel Pack',
      category: 'plugin',
      icon: 'verified_user',
      description: 'Automated compliance rule engine that validates audit logs and RBAC access matrices in real-time.',
      version: '3.1.0',
      publisher: 'SecOps Guild',
      price: 'Enterprise',
      downloads: '8.3k',
      rating: 4.9,
      installed: false
    }
  ]);

  protected readonly filteredItems = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();
    return this.storeItems().filter(item => {
      const matchCat = cat === 'all' || item.category === cat;
      const matchQuery = !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  });

  protected toggleInstall(item: StoreItem): void {
    this.storeItems.update(items =>
      items.map(i => (i.id === item.id ? { ...i, installed: !i.installed } : i))
    );
  }
}
