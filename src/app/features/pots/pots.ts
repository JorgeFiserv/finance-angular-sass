import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

import { PotsService } from '../../core/services/pots.service';
import { Pot } from '../../shared/models/Pot.model';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

@Component({
  selector: 'app-pots',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DecimalPipe, CurrencyInputDirective],
  templateUrl: './pots.html',
  styleUrl: './pots.scss',
})
export class PotsComponent implements OnDestroy {
  /* ===== Inject ===== */

  private potsService = inject(PotsService);
  private auth = inject(Auth);

  /* ===== STATE ===== */

  user = signal<User | null>(null);
  pots = signal<Pot[]>([]);

  isModalOpen = signal(false);
  modalMode = signal<'create' | 'add' | 'withdraw'>('create');
  currentPot = signal<any>(null);

  private unsubscribe: (() => void) | null = null;

  /* ===== COMPUTED ===== */

  totalSaved = computed(() => this.pots().reduce((sum, p) => sum + (p.currentAmount || 0), 0));

  totalTarget = computed(() => this.pots().reduce((sum, p) => sum + (p.targetAmount || 0), 0));

  overallProgress = computed(() => {
    const target = this.totalTarget();
    return target > 0 ? ((this.totalSaved() / target) * 100).toFixed(1) : '0';
  });

  /* ===== AUTH ===== */

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.cleanup();

      if (user) {
        this.user.set(user);

        this.unsubscribe = this.potsService.listen(user.uid, (pots) => this.pots.set(pots));
      }
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.pots.set([]);
  }

  /* ===== HELPERS ===== */

  getPercent(pot: Pot) {
    const target = pot.targetAmount ?? 0;
    const current = pot.currentAmount ?? 0;
    if (!target) return 0;
    return Math.min(100, (current / target) * 100);
  }

  getRemaining(pot: Pot) {
    const target = pot.targetAmount ?? 0;
    const current = pot.currentAmount ?? 0;
    return Math.max(0, target - current);
  }

  /* ===== MODAL ===== */

  openCreateModal() {
    this.modalMode.set('create');
    this.currentPot.set({
      name: '',
      targetAmount: null,
      color: '#2bb0a6',
    });
    this.isModalOpen.set(true);
  }

  openAddMoneyModal(pot: Pot) {
    this.modalMode.set('add');
    this.currentPot.set({ ...pot, amountToAdd: null });
    this.isModalOpen.set(true);
  }

  openWithdrawModal(pot: Pot) {
    this.modalMode.set('withdraw');
    this.currentPot.set({ ...pot, amountToWithdraw: null });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.currentPot.set(null);
  }

  /* ===== SAVE ===== */

  async saveModal() {
    const user = this.user();
    const pot = this.currentPot();

    if (!user || !pot) return;

    try {
      if (this.modalMode() === 'create') {
        await this.potsService.create(user.uid, pot);
      }

      if (this.modalMode() === 'add') {
        await this.potsService.addMoney(user.uid, pot.id, pot.amountToAdd);
      }

      if (this.modalMode() === 'withdraw') {
        await this.potsService.withdrawMoney(user.uid, pot.id, pot.amountToWithdraw);
      }

      this.closeModal();
    } catch (e) {
      alert('Operation failed: ' + e);
    }
  }

  /* ===== DELETE ===== */

  async deletePot(pot: Pot) {
    const user = this.user();
    if (!user) return;

    if (confirm(`Delete "${pot.name}"?`)) {
      await this.potsService.remove(user.uid, pot.id!);
    }
  }
}
