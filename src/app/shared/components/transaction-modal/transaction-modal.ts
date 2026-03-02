import { Component, input, output, signal, inject, effect } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInputDirective } from '../../directives/currency-input.directive';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id?: string;
  type: string;
  amount: number | null;
  category: string;
  date: Date;
  description: string;
  currency: string;
}

@Component({
  selector: 'app-transaction-modal',
  imports: [CurrencyInputDirective, FormsModule],
  templateUrl: './transaction-modal.html',
  styleUrl: './transaction-modal.scss',
})
export class TransactionModal {
  private toastService = inject(ToastService);
  isOpen = input<boolean>(false);
  onClose = output<void>();
  onSave = output<Transaction>();
  initialTransaction = input<Transaction | null>(null);
  mode = input<'create' | 'edit'>('create');
  transaction = signal<Transaction>(this.getInitialTransaction());

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const incoming = this.initialTransaction();
        if (this.mode() === 'edit' && incoming) {
          this.transaction.set({ ...incoming });
        }
      } else {
        this.resetForm();
      }
    });
  }

  save() {
    const tx = this.transaction();
    if (!this.isValidTransaction(tx)) {
      this.toastService.warning('Preencha todos os campos obrigatórios.');
      return;
    }

    this.onSave.emit(tx);
    this.resetForm();
    this.onClose.emit();
  }
  close() {
    this.resetForm();
    this.onClose.emit();
  }

  updateField<K extends keyof Transaction>(field: K, value: Transaction[K]) {
    this.transaction.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  parseCurrency(rawValue: string): number | null {
    const normalized = rawValue.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');

    const parsed = Number(normalized.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  formatDate(date: any): string {
    if (!date) return '';

    // Se é Timestamp do Firestore, converte
    const safeDate = date?.toDate ? date.toDate() : date instanceof Date ? date : new Date(date);

    if (Number.isNaN(safeDate.getTime())) {
      return '';
    }

    const year = safeDate.getFullYear();
    const month = String(safeDate.getMonth() + 1).padStart(2, '0');
    const day = String(safeDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseDate(rawValue: string): Date {
    if (!rawValue) {
      return new Date();
    }

    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private isValidTransaction(tx: Transaction): boolean {
    if (!tx.type || !tx.category || !tx.currency) return false;
    if (!this.isValidDate(tx.date)) return false;
    if (
      tx.amount === null ||
      typeof tx.amount !== 'number' ||
      !Number.isFinite(tx.amount) ||
      tx.amount <= 0
    )
      return false;
    return true;
  }

  private isValidDate(dateValue: any): boolean {
    if (!dateValue) return false;

    // Se é Timestamp do Firestore
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      const converted = dateValue.toDate();
      return !Number.isNaN(converted.getTime());
    }

    // Se é Date nativa
    if (dateValue instanceof Date) {
      return !Number.isNaN(dateValue.getTime());
    }

    // Se é string, tenta converter
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return !Number.isNaN(parsed.getTime());
    }

    return false;
  }

  private resetForm() {
    this.transaction.set(this.getInitialTransaction());
  }

  private getInitialTransaction(): Transaction {
    return {
      type: 'EXPENSE',
      amount: null as number | null,
      category: '',
      date: new Date(),
      description: '',
      currency: 'BRL',
    };
  }
}
