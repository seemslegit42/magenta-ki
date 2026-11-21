import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectRecord } from '../../../services/appwrite-backend-api.service';
import { ProjectService } from '../../../services/project.service';
import { ProjectFormComponent } from './project-form.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, ProjectFormComponent],
  template: `
    <div class="h-full flex flex-col space-y-4 font-['Lexend'] text-white select-none">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
        <div>
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#20B2AA] shadow-[0_0_10px_#20B2AA]"></span>
            <h2 class="font-display text-lg font-bold text-white flex items-center space-x-2">
              <span>Enterprise Projects Manager</span>
            </h2>
          </div>
          <p class="text-xs text-[#8C94A8] mt-1">
            Authoritative Appwrite TablesDB records with team-based tenant isolation and strict field immutability.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Search input -->
          <div class="relative">
            <span class="material-icons absolute left-2.5 top-2 text-xs text-[#8C94A8]">search</span>
            <input
              type="text"
              placeholder="Search projects..."
              class="w-48 bg-[#151922] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#20B2AA]"
              [value]="searchQuery()"
              (input)="searchQuery.set(getInputValue($event))" />
          </div>

          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl bg-[#20B2AA] hover:bg-[#3EB991] text-[#0E1015] text-xs font-bold font-display shadow-[0_0_15px_rgba(32,178,170,0.3)] flex items-center space-x-1.5 transition-all active:scale-95"
            (click)="showCreateModal.set(true)">
            <span class="material-icons text-xs">add_circle</span>
            <span>New Project</span>
          </button>
        </div>
      </div>

      <!-- Team Filter Bar & Quick Stats -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151922]/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shrink-0">
        <div class="flex items-center space-x-2 text-xs font-mono overflow-x-auto pb-1 sm:pb-0">
          <span class="text-[#8C94A8] text-[11px] mr-1">Tenant Scope:</span>
          <button
            type="button"
            class="px-3 py-1 rounded-lg border transition-colors whitespace-nowrap"
            [class.bg-[#20B2AA]]="currentFilter() === ''"
            [class.text-[#0E1015]]="currentFilter() === ''"
            [class.font-bold]="currentFilter() === ''"
            [class.border-[#20B2AA]]="currentFilter() === ''"
            [class.bg-white/5]="currentFilter() !== ''"
            [class.border-white/10]="currentFilter() !== ''"
            [class.text-[#8C94A8]]="currentFilter() !== ''"
            (click)="onFilterChange('')">
            All Teams ({{ projectService.projects().length }})
          </button>

          <button
            type="button"
            class="px-3 py-1 rounded-lg border transition-colors whitespace-nowrap"
            [class.bg-[#20B2AA]]="currentFilter() === 'team_enterprise_alpha'"
            [class.text-[#0E1015]]="currentFilter() === 'team_enterprise_alpha'"
            [class.font-bold]="currentFilter() === 'team_enterprise_alpha'"
            [class.border-[#20B2AA]]="currentFilter() === 'team_enterprise_alpha'"
            [class.bg-white/5]="currentFilter() !== 'team_enterprise_alpha'"
            [class.border-white/10]="currentFilter() !== 'team_enterprise_alpha'"
            [class.text-[#8C94A8]]="currentFilter() !== 'team_enterprise_alpha'"
            (click)="onFilterChange('team_enterprise_alpha')">
            team_enterprise_alpha
          </button>

          <button
            type="button"
            class="px-3 py-1 rounded-lg border transition-colors whitespace-nowrap"
            [class.bg-[#20B2AA]]="currentFilter() === 'team_devops'"
            [class.text-[#0E1015]]="currentFilter() === 'team_devops'"
            [class.font-bold]="currentFilter() === 'team_devops'"
            [class.border-[#20B2AA]]="currentFilter() === 'team_devops'"
            [class.bg-white/5]="currentFilter() !== 'team_devops'"
            [class.border-white/10]="currentFilter() !== 'team_devops'"
            [class.text-[#8C94A8]]="currentFilter() !== 'team_devops'"
            (click)="onFilterChange('team_devops')">
            team_devops
          </button>
        </div>

        <div class="flex items-center space-x-2 text-[11px] font-mono text-[#8C94A8]">
          <span>Status: <strong class="text-[#3EB991]">{{ projectService.isLoading() ? 'Syncing...' : 'Connected' }}</strong></span>
        </div>
      </div>

      <!-- Action Status Banner -->
      @if (actionMessage()) {
        <div class="p-3 rounded-xl bg-[#20B2AA]/15 border border-[#20B2AA]/40 text-[#20B2AA] text-xs font-mono flex items-center justify-between shrink-0">
          <span>{{ actionMessage() }}</span>
          <button type="button" class="text-white hover:text-[#20B2AA]" (click)="actionMessage.set(null)">
            <span class="material-icons text-xs">close</span>
          </button>
        </div>
      }

      <!-- Project Cards Grid -->
      <div class="flex-1 overflow-y-auto pr-1">
        @if (projectService.isLoading() && filteredProjects().length === 0) {
          <div class="flex flex-col items-center justify-center h-48 space-y-2 text-[#8C94A8]">
            <span class="material-icons animate-spin text-2xl text-[#20B2AA]">refresh</span>
            <span class="text-xs font-mono">Querying Appwrite TablesDB...</span>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            @for (proj of filteredProjects(); track proj.$id) {
              <div class="bg-[#151922]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-lg space-y-3 transition-all flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="font-display font-bold text-white text-sm">{{ proj.name }}</h3>
                      <p class="text-xs text-[#8C94A8] mt-1 line-clamp-2 leading-relaxed">
                        {{ proj.description || 'No architectural description provided.' }}
                      </p>
                    </div>
                    <span class="text-[10px] font-mono text-[#8C94A8] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {{ proj.$id }}
                    </span>
                  </div>

                  <!-- Metadata Badges -->
                  <div class="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-white/5 text-[10px] font-mono">
                    <span class="bg-[#3EB991]/15 text-[#3EB991] px-2 py-0.5 rounded border border-[#3EB991]/30 flex items-center space-x-1">
                      <span class="material-icons text-[10px]">person</span>
                      <span>createdBy: {{ proj.createdBy || 'usr_operator_7842' }}</span>
                      <span class="material-icons text-[10px] text-[#8C94A8]" title="Immutable">lock</span>
                    </span>

                    <span class="bg-[#20B2AA]/15 text-[#20B2AA] px-2 py-0.5 rounded border border-[#20B2AA]/30 flex items-center space-x-1">
                      <span class="material-icons text-[10px]">groups</span>
                      <span>teamId: {{ proj.teamId || 'personal' }}</span>
                      <span class="material-icons text-[10px] text-[#8C94A8]" title="Immutable">lock</span>
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <span class="text-[10px] text-[#8C94A8] font-mono">
                    Updated: {{ (proj.$updatedAt || proj.$createdAt) | date:'short' }}
                  </span>

                  <div class="flex items-center space-x-2">
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-lg bg-[#FF2A9D]/10 hover:bg-[#FF2A9D]/20 text-[#FF2A9D] border border-[#FF2A9D]/30 text-[11px] font-mono transition-all flex items-center space-x-1"
                      (click)="testImmutability(proj)"
                      title="Verify backend rejects illegal update to immutable createdBy/teamId">
                      <span class="material-icons text-[11px]">security</span>
                      <span>Test Immutability</span>
                    </button>

                    <button
                      type="button"
                      class="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#8C94A8] hover:text-red-400 transition-colors"
                      (click)="deleteProject(proj.$id || '')"
                      title="Delete Project">
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="col-span-full py-16 text-center space-y-2 bg-[#151922]/50 border border-white/5 rounded-2xl">
                <span class="material-icons text-3xl text-[#8C94A8]">folder_off</span>
                <p class="text-xs text-[#8C94A8] font-mono">No projects found matching current tenant filter.</p>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-[#20B2AA] text-[#0E1015] font-bold text-xs mt-2"
                  (click)="showCreateModal.set(true)">
                  Create First Project
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Create Project Modal Overlay -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div class="max-w-md w-full">
            <app-project-form
              (saved)="onProjectSaved()"
              (cancelled)="showCreateModal.set(false)" />
          </div>
        </div>
      }
    </div>
  `,
})
export class ProjectListComponent {
  protected readonly projectService = inject(ProjectService);

  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly currentFilter = signal<string>('');
  protected readonly searchQuery = signal<string>('');
  protected readonly actionMessage = signal<string | null>(null);

  protected readonly filteredProjects = computed(() => {
    const list = this.projectService.projects();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)),
    );
  });

  public getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  public async onFilterChange(teamId: string): Promise<string> {
    this.currentFilter.set(teamId);
    await this.projectService.setTeamFilter(teamId);
    return teamId;
  }

  public async onProjectSaved(): Promise<void> {
    this.showCreateModal.set(false);
    this.actionMessage.set('Project created successfully with strict ownership enforcement.');
    await this.projectService.fetchProjects(this.currentFilter() || undefined);
  }

  public async deleteProject(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await this.projectService.deleteProject(id);
      this.actionMessage.set(`Successfully deleted project ${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting project';
      this.actionMessage.set(`Failed to delete project: ${msg}`);
    }
  }

  public async testImmutability(proj: ProjectRecord): Promise<void> {
    try {
      // Attempt unauthorized modification to immutable fields
      await this.projectService.updateProject(proj.$id || '', {
        createdBy: 'unauthorized_malicious_user',
        teamId: 'illegal_tenant_id',
      });
      this.actionMessage.set('Security Warning: Backend failed to enforce immutability!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation error';
      this.actionMessage.set(`Immutability Test Passed! Server rejected update: ${msg}`);
    }
  }
}
