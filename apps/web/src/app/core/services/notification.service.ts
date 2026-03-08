import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toasts$ = new Subject<Toast>();
  private toastList: Toast[] = [];
  private nextId = 0;

  get notifications$(): Observable<Toast> {
    return this.toasts$.asObservable();
  }

  getToasts(): Toast[] {
    return this.toastList;
  }

  success(message: string, duration = 3000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 4000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 3500): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 3000): void {
    this.show('info', message, duration);
  }

  private show(type: NotificationType, message: string, duration: number): void {
    const toast: Toast = {
      id: `toast-${this.nextId++}`,
      type,
      message,
      duration,
    };

    this.toastList.push(toast);
    this.toasts$.next(toast);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }
  }

  remove(id: string): void {
    this.toastList = this.toastList.filter((t) => t.id !== id);
  }

  clear(): void {
    this.toastList = [];
  }
}
