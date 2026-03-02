import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss',
})
export class ConfirmModal {
  isOpen = input<boolean>(false);
  title = input<string>('Confirmar ação');
  message = input<string>('Deseja realmente continuar?');
  confirmLabel = input<string>('Confirmar');
  cancelLabel = input<string>('Cancelar');

  onConfirm = output<void>();
  onCancel = output<void>();
}
