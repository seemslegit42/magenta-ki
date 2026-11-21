import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-[#151922] border border-white/10 rounded-2xl p-5 shadow-2xl font-['Lexend'] text-white space-y-4">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div class="flex items-center space-x-2">
          <span class="material-icons text-[#20B2AA]">note_add</span>
          <h3 class="font-display font-bold text-sm text-white">Create New Project Entry</h3>
        </div>
        <button
          type="button"
          class="w-7 h-7 rounded-lg hover:bg-white/10 text-[#8C94A8] hover:text-white flex items-center justify-center transition-colors"
          (click)="cancelled.emit()">
          <span class="material-icons text-sm">close</span>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
        <!-- Project Name -->
        <div>
          <label for="project-name-input" class="block font-medium text-[#8C94A8] mb-1">
            Project Name <span class="text-[#FF2A9D]">*</span>
          </label>
          <input
            id="project-name-input"
            type="text"
            formControlName="name"
            class="w-full bg-[#0E1015] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#20B2AA] transition-colors"
            placeholder="e.g. Distributed Mesh Orchestrator" />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <p class="text-[10px] text-red-400 mt-1 font-mono">Project name is required.</p>
          }
        </div>

        <!-- Description -->
        <div>
          <label for="project-desc-input" class="block font-medium text-[#8C94A8] mb-1">
            Description (Optional)
          </label>
          <textarea
            id="project-desc-input"
            rows="2"
            formControlName="description"
            class="w-full bg-[#0E1015] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#20B2AA] transition-colors"
            placeholder="Briefly describe project scope and architecture..."></textarea>
        </div>

        <!-- Team ID (Tenant Scope) -->
        <div>
          <label for="project-team-select" class="block font-medium text-[#8C94A8] mb-1 flex items-center justify-between">
            <span>Team / Tenant Scope (<code class="text-[#FF2A9D]">teamId</code>)</span>
            <span class="text-[10px] text-[#20B2AA] font-mono">Immutable after creation</span>
          </label>
          <select
            id="project-team-select"
            formControlName="teamId"
            class="w-full bg-[#0E1015] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#20B2AA] font-mono text-[11px] transition-colors">
            <option value="team_enterprise_alpha">team_enterprise_alpha (Enterprise Core)</option>
            <option value="team_devops">team_devops (Infrastructure &amp; CI/CD)</option>
            <option value="">Personal / Unscoped (Direct Owner)</option>
          </select>
          <p class="text-[10px] text-[#8C94A8] mt-1">
            Setting a team ID binds row-level Appwrite permissions so team members get automatic access.
          </p>
        </div>

        @if (errorMessage()) {
          <div class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-mono">
            {{ errorMessage() }}
          </div>
        }

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition-colors"
            (click)="cancelled.emit()">
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-xl bg-[#20B2AA] hover:bg-[#3EB991] text-[#0E1015] font-bold text-xs font-display shadow-[0_0_15px_rgba(32,178,170,0.3)] transition-all active:scale-95 disabled:opacity-50"
            [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ProjectFormComponent {
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly projectService = inject(ProjectService);

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    teamId: ['team_enterprise_alpha']
  });

  public async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    try {
      await this.projectService.createProject({
        name: val.name,
        description: val.description ? val.description : undefined,
        teamId: val.teamId ? val.teamId : undefined
      });
      this.saved.emit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      this.errorMessage.set(msg);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
