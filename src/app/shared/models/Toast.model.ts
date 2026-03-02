export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  message: string;
  type: ToastType;
  duration?: number;
}
