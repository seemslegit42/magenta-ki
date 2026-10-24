import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  BEEP_REMOTE_NAME,
  BEEP_SHELL_MODULE,
  BeepRemoteService,
} from '../../../services/beep-remote.service';
import { NativeFederationService } from '../../../services/native-federation.service';

type ShellSurfaceModule = {
  mountBeepShell?: (container: HTMLElement) => Promise<void>;
  unmountBeepShell?: () => void;
};

@Component({
  selector: 'app-beep-erp-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="beep-frame">
      @if (mode() === 'federation') {
        <div #federationHost class="beep-frame__embed beep-frame__federation-host"></div>
      } @else {
        <iframe
          class="beep-frame__embed"
          [src]="iframeSrc()"
          title="B.E.E.P — Syndicate Resource Planning"
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      }
      <p class="beep-frame__hint font-mono text-[10px] text-on-surface-variant px-2 py-1 border-t border-outline/10 bg-surface-container/80">
        BEEP UI at {{ uiOrigin() }}
        @if (mode() === 'federation') {
          <span> · Native Federation <code class="text-secondary">{{ federationModule }}</code></span>
        } @else {
          <span> · embed fallback (remote entry unavailable)</span>
        }
        — override with localStorage <code class="text-secondary">lxv-beep-ui-origin</code>
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 28rem;
    }

    .beep-frame {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: inherit;
      margin: -0.75rem -1rem -1rem;
      width: calc(100% + 2rem);
    }

    @media (min-width: 768px) {
      .beep-frame {
        margin: -1rem -1rem -1rem;
        width: calc(100% + 2rem);
      }
    }

    .beep-frame__embed {
      flex: 1 1 auto;
      width: 100%;
      min-height: 24rem;
      border: 0;
      background: var(--color-surface-lowest);
    }

    .beep-frame__federation-host {
      overflow: auto;
    }

    .beep-frame__hint {
      flex-shrink: 0;
    }
  `,
})
export class BeepErpWindowComponent implements OnInit, OnDestroy {
  private readonly beepRemote = inject(BeepRemoteService);
  private readonly federation = inject(NativeFederationService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly federationModule = BEEP_SHELL_MODULE;
  protected readonly mode = signal<'federation' | 'iframe'>('iframe');
  protected readonly uiOrigin = signal(this.beepRemote.resolveUiOrigin());
  protected readonly iframeSrc = signal<SafeResourceUrl>(
    this.sanitizer.bypassSecurityTrustResourceUrl(`${this.beepRemote.resolveUiOrigin()}/`),
  );

  private readonly hostRef = viewChild<ElementRef<HTMLElement>>('federationHost');
  private shellModule: ShellSurfaceModule | null = null;

  async ngOnInit(): Promise<void> {
    const origin = await this.beepRemote.discoverUiOrigin();
    this.uiOrigin.set(origin);
    this.beepRemote.syncRemoteRegistration(origin);
    this.iframeSrc.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(`${origin}/`),
    );

    const entry = this.beepRemote.remoteEntryUrl(origin);
    let entryOk = false;
    try {
      const head = await fetch(entry, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
      entryOk = head.ok;
    } catch {
      entryOk = false;
    }

    if (!entryOk) {
      this.federation.addLog(
        `[BEEP] remoteEntry not served at ${entry} — using full UI embed at ${origin}/`,
      );
      this.mode.set('iframe');
      return;
    }

    const loaded = await this.federation.loadRemoteComponent<ShellSurfaceModule>({
      remoteName: BEEP_REMOTE_NAME,
      exposedModule: BEEP_SHELL_MODULE,
      remoteEntry: entry,
    });

    if (loaded.error || !loaded.component?.mountBeepShell) {
      this.federation.addLog(
        `[BEEP] Federation mount failed (${loaded.error ?? 'missing mountBeepShell'}) — iframe fallback`,
      );
      this.mode.set('iframe');
      return;
    }

    this.shellModule = loaded.component;
    this.mode.set('federation');

    queueMicrotask(() => {
      const el = this.hostRef()?.nativeElement;
      if (el && this.shellModule?.mountBeepShell) {
        void this.shellModule.mountBeepShell(el);
      }
    });
  }

  ngOnDestroy(): void {
    this.shellModule?.unmountBeepShell?.();
    this.shellModule = null;
  }
}
