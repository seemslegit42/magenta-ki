import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShellChromeService } from '../../services/shell-chrome.service';

@Component({
  selector: 'app-desktop-backdrop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desktop-backdrop.component.html',
  styleUrl: './desktop-backdrop.component.css',
})
export class DesktopBackdropComponent {
  protected readonly chrome = inject(ShellChromeService);
}
