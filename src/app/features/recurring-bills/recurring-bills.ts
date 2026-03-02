import { Component, signal, computed, effect, inject, OnDestroy } from '@angular/core';
import { RecurringBill } from '../../shared/models/RecurringBill.model';
import { RecurringBillsService } from '../../core/services/recurring-bill.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

@Component({
  selector: 'app-recurring-bills',
  imports: [CurrencyPipe, DatePipe, FormsModule, CurrencyInputDirective],
  templateUrl: './recurring-bills.html',
  styleUrl: './recurring-bills.scss',
})
export class RecurringBills implements OnDestroy {
  //dependency injection
  private auth = inject(Auth);
  private recurringBillsService = inject(RecurringBillsService);
  private toastService = inject(ToastService);

  //reactive state
  user = signal<User | null>(null);
  recurringBills = signal<RecurringBill[]>([]);
  loading = signal(false);
  showForm = signal(false);

  newBill = signal<RecurringBill>({
    name: '',
    amount: 0,
    frequency: '' as any,
    category: '',
    nextDueDate: new Date(),
    isActive: true,
    currency: 'BRL',
  });

  frequencies = ['DIÁRIA', 'SEMANAL', 'MENSAL', 'ANUAL'];
  categories = ['Casa', 'Carro', 'Esportes', 'Seguro', 'Outro'];

  //derived state
  totalMonthly = computed(() => {
    return this.recurringBills()
      .filter((bill) => bill.isActive)
      .reduce((acc, bill) => acc + bill.amount, 0);
  });

  activeBillsCount = computed(() => {
    return this.recurringBills().filter((b) => b.isActive).length;
  });

  // Methods to update form fields
  updateName(value: string) {
    this.newBill.update((bill) => ({ ...bill, name: value }));
  }

  updateAmount(value: number) {
    this.newBill.update((bill) => ({ ...bill, amount: value }));
  }

  updateCategory(value: string) {
    this.newBill.update((bill) => ({ ...bill, category: value }));
  }

  updateFrequency(value: string) {
    this.newBill.update((bill) => ({ ...bill, frequency: value as any }));
  }

  updateNextDueDate(value: string) {
    this.newBill.update((bill) => ({ ...bill, nextDueDate: new Date(value) }));
  }

  updateCurrency(value: string) {
    this.newBill.update((bill) => ({ ...bill, currency: value }));
  }

  updateDescription(value: string) {
    this.newBill.update((bill) => ({ ...bill, description: value }));
  }

  updateAutoDebit(value: boolean) {
    this.newBill.update((bill) => ({ ...bill, autoDebit: value }));
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDateValue(dateValue: any): Date {
    if (!dateValue) return new Date();
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    return dateValue instanceof Date ? dateValue : new Date(dateValue);
  }

  private unsubscribe: (() => void) | null = null;
  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (!user) return;
      this.user.set(user);
      this.listenBills(user.uid);
    });
  }

  private listenBills(userId: string) {
    this.unsubscribe = this.recurringBillsService.listen(userId, (bills: RecurringBill[]) => {
      this.recurringBills.set(bills);
    });
  }

  saveBill() {
    const bill = this.newBill();

    if (!bill.name || !bill.amount || !bill.frequency) {
      this.toastService.error('Nome, valor e frequência são obrigatórios');
      return;
    }

    if (!this.user()) return;

    this.loading.set(true);

    this.recurringBillsService
      .create(this.user()!.uid, bill)
      .then(() => {
        this.toastService.success('Conta salva com sucesso');
        this.resetForm();
      })
      .catch((err) => this.toastService.error(err.message))
      .finally(() => this.loading.set(false));
  }
  deleteBill(id: string) {
    if (!confirm('Tem certeza que deseja deletar esta conta?')) return;
    if (!this.user()) return;

    this.recurringBillsService
      .remove(this.user()!.uid, id)
      .then(() => this.toastService.success('Conta deletada com sucesso'))
      .catch((err) => this.toastService.error(err.message));
  }

  toggleActive(bill: RecurringBill) {
    if (!this.user() || !bill.id) return;

    this.recurringBillsService
      .update(this.user()!.uid, bill.id, {
        ...bill,
        isActive: !bill.isActive,
      })
      .then(() => this.toastService.success('Atualizado!'))
      .catch((err) => this.toastService.error(err.message));
  }

  resetForm() {
    this.newBill.set({
      name: '',
      amount: 0,
      frequency: '' as any,
      category: '',
      nextDueDate: new Date(),
      isActive: true,
      currency: 'BRL',
    });
    this.showForm.set(false);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
