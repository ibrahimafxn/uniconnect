import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = {
  options: ConfirmOptions;
};

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly stateSubject = new BehaviorSubject<ConfirmState | null>(null);
  readonly state$ = this.stateSubject.asObservable();
  private current: Subject<boolean> | null = null;

  open(options: ConfirmOptions): Observable<boolean> {
    if (this.current) {
      this.current.next(false);
      this.current.complete();
    }
    this.current = new Subject<boolean>();
    this.stateSubject.next({ options });
    return this.current.asObservable();
  }

  confirm() {
    if (!this.current) return;
    this.current.next(true);
    this.current.complete();
    this.clear();
  }

  cancel() {
    if (!this.current) return;
    this.current.next(false);
    this.current.complete();
    this.clear();
  }

  private clear() {
    this.current = null;
    this.stateSubject.next(null);
  }
}
