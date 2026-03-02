import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { TransactionsService } from '../../core/services/transactions.service';
import { ToastService } from '../../core/services/toast.service';
import { Auth, authState, User } from '@angular/fire/auth';
import { TransactionsFilter } from '../../shared/models/TransactionsFilter.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { TransactionModal } from '../../shared/components/transaction-modal/transaction-modal';
import { TransactionViewModal } from '../../shared/components/transaction-view-modal/transaction-view-modal';

@Component({
  selector: 'app-transactions',
  imports: [DatePipe, CurrencyPipe, TransactionModal, TransactionViewModal],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class TransactionsListComponent implements OnInit, OnDestroy {
  private transactionsService = inject(TransactionsService);
  private toastService = inject(ToastService);
  private auth = inject(Auth);
  transactions = signal<any[]>([]);
  filters = signal<TransactionsFilter>({});
  user = toSignal(authState(this.auth), { initialValue: null });
  private unsubscribe: (() => void) | null = null;
  isModalOpen = signal(false);
  modalMode = signal<any | null>(null);
  selectedTransaction = signal<any | null>(null);
  isViewModalOpen = signal(false);
  editModal = signal<any | null>(false);
  isDeleteModalOpen = signal(false);
  deleteTarget = signal<any | null>(null);
  editModel = signal<any | null>(null);
  //pagination
  currentPage = signal(1);
  itemsPerPage = 10;
  filteredTransactions = signal<any[]>([]);
  paginatedTransactions = signal<any[]>([]);

  /*=== INIT ===*/
  constructor() {
    effect(() => {
      const user = this.user();
      this.cleanup();
      if (user) {
        this.unsubscribe = this.transactionsService.listen(user.uid, (transactions) => {
          this.transactions.set(transactions);
          this.currentPage.set(1);
          this.updatePagination();
        });
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.cleanup();
  }
  private cleanup() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.transactions.set([]);
  }
  //*FILTERS*//
  updateFilterFromDate(value: string) {
    this.filters.update((f) => ({ ...f, fromDate: value }));
    this.currentPage.set(1);
    this.updatePagination();
  }

  updateFilterToDate(value: string) {
    this.filters.update((f) => ({ ...f, toDate: value }));
    this.currentPage.set(1);
    this.updatePagination();
  }

  updateFilterType(value: string) {
    this.filters.update((f) => ({ ...f, type: value }));
    this.currentPage.set(1);
    this.updatePagination();
  }

  updateFilterCategory(value: string) {
    this.filters.update((f) => ({ ...f, category: value }));
    this.currentPage.set(1);
    this.updatePagination();
  }

  applyFilters(tx: any): boolean {
    const filters = this.filters();

    if (filters.type && filters.type !== 'ALL' && tx.type !== filters.type) return false;
    if (filters.category && tx.category !== filters.category) return false;

    if (filters.fromDate) {
      const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      if (txDate < new Date(filters.fromDate)) return false;
    }

    if (filters.toDate) {
      const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      if (txDate > toDate) return false;
    }

    return true;
  }
  clearFilters() {
    this.filters.set({
      fromDate: null,
      toDate: null,
      type: '',
      category: '',
    });
    this.currentPage.set(1);
    this.updatePagination();
  }
  getFilteredTransactions() {
    return this.transactions().filter((tx) => this.applyFilters(tx));
  }
  updatePagination() {
    const filtered = this.getFilteredTransactions();
    this.filteredTransactions.set(filtered);
    const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    if (this.currentPage() > totalPages && totalPages > 0) {
      this.currentPage.set(totalPages);
    } else if (totalPages === 0) {
      this.currentPage.set(1);
    }
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedTransactions.set(filtered.slice(start, end));
  }
  onPageChange(page: number) {
    this.currentPage.set(page);

    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedTransactions.set(this.filteredTransactions().slice(start, end));
  }

  getBalanceTotal() {
    return this.getFilteredTransactions().reduce((total, tx) => {
      const amount = Number(tx.amount) || 0;

      if (tx.type === 'INCOME') return total + amount;
      if (tx.type === 'EXPENSE') return total - amount;

      return total;
    }, 0);
  }

  /* ================= CREATE ================= */

  openCreateModal() {
    this.selectedTransaction.set(null);
    this.modalMode.set('create');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async saveTransaction(transaction: any) {
    const user = this.user();
    if (!user) {
      this.toastService.warning('Faça login para salvar transações.');
      return;
    }

    try {
      // Se tem ID, é edição; senão é criação
      if (transaction.id) {
        // Editar
        await this.transactionsService.update(user.uid, transaction.id, transaction);
        this.transactions.update((current) =>
          current.map((tx) => (tx.id === transaction.id ? { ...tx, ...transaction } : tx)),
        );
        this.toastService.success('Transação atualizada!');
      } else {
        // Criar
        const createdRef = await this.transactionsService.create(user.uid, transaction);
        this.transactions.update((current) => [
          {
            id: createdRef.id,
            ...transaction,
            createdAt: new Date(),
          },
          ...current,
        ]);
        this.toastService.success('Transação criada!');
      }
      this.updatePagination();
      this.closeModal();
      this.selectedTransaction.set(null);
    } catch (e) {
      console.error(e);
      this.toastService.error('Erro ao salvar transação');
    }
  }

  /* ================= VIEW ================= */

  view(tx: any) {
    this.modalMode.set('view');
    this.selectedTransaction.set(this.normalizeTransaction(tx));
    this.editModel.set(null);
    this.isViewModalOpen.set(true);
  }

  closeViewModal() {
    this.isViewModalOpen.set(false);
    this.selectedTransaction.set(null);
    this.modalMode.set(null);
  }

  /* ================= EDIT ================= */

  edit(tx: any) {
    const normalized = this.normalizeTransaction(tx);
    this.selectedTransaction.set(normalized);
    this.modalMode.set('edit');
    this.isModalOpen.set(true);
  }

  /* ================= DELETE ================= */

  delete(tx: any) {
    const user = this.user();
    if (!user) return;

    this.deleteTarget.set(tx);
    this.isDeleteModalOpen.set(true);

    const confirmed = confirm('Deseja excluir esta transação?');

    if (confirmed) {
      this.confirmDelete();
    } else {
      this.cancelDelete();
    }
  }

  async deleteTransaction(txId: string) {
    const user = this.user();
    if (!user) return;

    try {
      await this.transactionsService.delete(user.uid, txId);
    } catch (e) {
      console.error(e);
    }
  }

  cancelDelete() {
    this.isDeleteModalOpen.set(false);
    this.deleteTarget.set(null);
  }

  async confirmDelete() {
    const user = this.user();
    const target = this.deleteTarget();

    if (!user || !target) return;

    try {
      await this.transactionsService.delete(user.uid, target.id);
      this.cancelDelete();
      alert('Transação excluída');
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir');
    }
  }

  closeDetailsModal() {
    this.modalMode.set(null);
    this.selectedTransaction.set(null);
    this.editModel.set(null);
  }

  async saveEdit() {
    const user = this.user();
    const model = this.editModel();

    if (!user || !model) return;

    const payload = {
      type: model.type,
      amount: Number(model.amount) || 0,
      category: model.category,
      date: model.date ? new Date(model.date) : new Date(),
      description: model.description || '',
      currency: model.currency || 'BRL',
    };

    try {
      await this.transactionsService.update(user.uid, model.id, payload);
      this.closeDetailsModal();
      alert('Transação atualizada');
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar');
    }
  }

  /* ================= HELPERS ================= */

  private normalizeTransaction(tx: any) {
    return {
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount) || 0,
      category: tx.category,
      date: tx.date,
      description: tx.description,
      currency: tx.currency || 'BRL',
    };
  }

  private toEditModel(tx: any) {
    return {
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount) || 0,
      category: tx.category,
      date: this.normalizeDateObject(tx.date),
      description: tx.description,
      currency: tx.currency || 'BRL',
    };
  }

  private normalizeDateObject(dateValue: any) {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);

    return isNaN(date.getTime()) ? null : date;
  }
}
