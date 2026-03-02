import { Component, effect, inject, signal } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../models/Toast.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast',
  imports: [NgClass],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  private toastService = inject(ToastService);
  visible = signal(false);
  message = signal('');
  type = signal<'success' | 'error' | 'warning' | 'info'>('info');
  constructor() {
    effect(() => {
      const toast = this.toastService.toast();
      if (!toast) return;
      this.message.set(toast.message);
      this.type.set(toast.type);
      this.visible.set(true);
      setTimeout(() => {
        this.visible.set(false);
      }, toast.duration ?? 3000);
    });
  }
}
