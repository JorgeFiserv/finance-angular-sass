import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../shared/models/Toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private _toast = signal<Toast | null>(null);
  //readonly para consumo externo
  toast = this._toast.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 3000) {
    this._toast.set({ message, type, duration });

    setTimeout(() => this.clear(), duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  clear() {
    this._toast.set(null);
  }
}
