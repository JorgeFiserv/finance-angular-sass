import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';

interface TransactionView {
  id?: string;
  type: 'INCOME' | 'EXPENSE' | string;
  amount: number | null;
  category: string;
  date: any;
  description: string;
  currency: string;
}

@Component({
  selector: 'app-transaction-view-modal',
  imports: [CurrencyPipe, DatePipe, NgClass],
  templateUrl: './transaction-view-modal.html',
  styleUrl: './transaction-view-modal.scss',
})
export class TransactionViewModal {
  isOpen = input<boolean>(false);
  transaction = input<TransactionView | null>(null);
  onClose = output<void>();

  close() {
    this.onClose.emit();
  }

  getTypeLabel(type: string | null | undefined) {
    return type === 'INCOME' ? 'Receita' : 'Despesa';
  }
}
