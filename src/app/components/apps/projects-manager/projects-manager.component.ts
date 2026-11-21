import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProjectListComponent } from './project-list.component';

@Component({
  selector: 'app-projects-manager',
  standalone: true,
  imports: [CommonModule, ProjectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full p-4 bg-[#0E1015]/95 flex flex-col overflow-hidden font-['Lexend']">
      <app-project-list />
    </div>
  `,
})
export class ProjectsManagerComponent {
  @Input({ required: true }) pid!: string;
}
