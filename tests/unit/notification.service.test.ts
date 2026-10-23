import { describe, it, expect, beforeEach } from 'bun:test';
import { NotificationService } from '../../ts/apps/host/app/services/notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it('should initialize with default unread notifications', () => {
    const notifications = service.allNotifications();
    expect(notifications.length).toBeGreaterThanOrEqual(3);
    expect(service.unreadCount()).toBeGreaterThan(0);
  });

  it('should dispatch a new notification and add to active toasts if enabled', () => {
    const initialCount = service.allNotifications().length;

    const notif = service.notify({
      title: 'Task Assigned',
      message: 'You have been assigned to verify security rules.',
      category: 'task',
      priority: 'high',
      sourceApp: 'Task Manager',
    });

    expect(notif.id.startsWith('notif_')).toBe(true);
    expect(service.allNotifications().length).toBe(initialCount + 1);
    expect(service.unreadCount()).toBeGreaterThan(0);

    // Desktop toast should be added
    const toasts = service.toasts();
    expect(toasts.some(t => t.id === notif.id)).toBe(true);
  });

  it('should mark a notification as read and decrement unreadCount', () => {
    const unread = service.allNotifications().find(n => !n.read)!;
    const initialUnread = service.unreadCount();

    service.markAsRead(unread.id);
    expect(service.unreadCount()).toBe(initialUnread - 1);
    expect(service.allNotifications().find(n => n.id === unread.id)!.read).toBe(true);
  });

  it('should mark all notifications as read', () => {
    service.markAllAsRead();
    expect(service.unreadCount()).toBe(0);
  });

  it('should dismiss active desktop toasts', () => {
    const notif = service.notify({
      title: 'Alert',
      message: 'Test message',
      category: 'message',
    });

    expect(service.toasts().some(t => t.id === notif.id)).toBe(true);
    service.dismissToast(notif.id);
    expect(service.toasts().some(t => t.id === notif.id)).toBe(false);
  });

  it('should customize notification preferences and filter category alerts', () => {
    // Disable message category
    service.updatePreferences({
      categories: {
        task: true,
        message: false,
        update: true,
        security: true,
        lock: true,
      },
    });

    expect(service.currentPreferences().categories.message).toBe(false);

    // Dispatching message should add to notification history but NOT to toasts
    const notif = service.notify({
      title: 'Muted Message',
      message: 'This should not appear in active toasts',
      category: 'message',
    });

    expect(service.toasts().some(t => t.id === notif.id)).toBe(false);
    expect(service.allNotifications().some(n => n.id === notif.id)).toBe(true);
  });
});
