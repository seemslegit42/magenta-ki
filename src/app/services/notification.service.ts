import { Injectable, signal, computed } from '@angular/core';
import { WebOsNotification, NotificationPreferences, NotificationCategory, NotificationPriority } from '../models/webos.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications = signal<WebOsNotification[]>([
    {
      id: 'notif_001',
      timestamp: Date.now() - 3600000,
      title: 'New Collaborative Task',
      message: 'Marcus Vance assigned you to review "Q3 Strategic Enterprise Roadmap".',
      category: 'task',
      priority: 'high',
      read: false,
      sourceApp: 'WOPI Office',
      actionLabel: 'Review Document',
    },
    {
      id: 'notif_002',
      timestamp: Date.now() - 1800000,
      title: 'Edge Cluster Synchronized',
      message: 'Turso edge mesh completed replica verification across 3 global regions.',
      category: 'update',
      priority: 'normal',
      read: false,
      sourceApp: 'Control Plane Gateway',
    },
    {
      id: 'notif_003',
      timestamp: Date.now() - 900000,
      title: 'SecOps Audit Notice',
      message: 'Security policy refresh completed. Zero privilege escalations detected.',
      category: 'security',
      priority: 'normal',
      read: true,
      sourceApp: 'Security Sentinel',
    },
    {
      id: 'notif_004',
      timestamp: Date.now() - 300000,
      title: 'Direct Message',
      message: 'Elena Rostova: "Please verify the latest libSQL edge migration."',
      category: 'message',
      priority: 'high',
      read: false,
      sourceApp: 'Enterprise Communicator',
      actionLabel: 'Open Reply',
    },
  ]);

  private activeToasts = signal<WebOsNotification[]>([]);

  private preferences = signal<NotificationPreferences>({
    soundEnabled: true,
    desktopToastsEnabled: true,
    categories: {
      message: true,
      task: true,
      update: true,
      security: true,
      lock: true,
    },
  });

  public readonly allNotifications = computed(() => this.notifications());

  public readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  public readonly toasts = computed(() => this.activeToasts());

  public readonly currentPreferences = computed(() => this.preferences());

  public notify(payload: {
    title: string;
    message: string;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    sourceApp?: string;
    actionLabel?: string;
  }): WebOsNotification {
    const category = payload.category || 'update';
    const notif: WebOsNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      timestamp: Date.now(),
      title: payload.title,
      message: payload.message,
      category,
      priority: payload.priority || 'normal',
      read: false,
      sourceApp: payload.sourceApp,
      actionLabel: payload.actionLabel,
    };

    this.notifications.update(list => [notif, ...list]);

    // Check if toasts are enabled for this category
    const prefs = this.preferences();
    if (prefs.desktopToastsEnabled && prefs.categories[category]) {
      this.activeToasts.update(toasts => [notif, ...toasts.slice(0, 2)]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        this.dismissToast(notif.id);
      }, 5000);
    }

    return notif;
  }

  public markAsRead(id: string): void {
    this.notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  public markAllAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  public clearNotification(id: string): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
    this.dismissToast(id);
  }

  public clearAll(): void {
    this.notifications.set([]);
    this.activeToasts.set([]);
  }

  public dismissToast(id: string): void {
    this.activeToasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  public updatePreferences(newPrefs: Partial<NotificationPreferences>): void {
    this.preferences.update(current => ({
      ...current,
      ...newPrefs,
      categories: {
        ...current.categories,
        ...(newPrefs.categories || {}),
      },
    }));
  }
}
