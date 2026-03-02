import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { ToastService } from '../../core/services/toast.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class OverviewComponent implements OnInit, OnDestroy {
  // ===== DEPENDENCIES =====
  private auth = inject(Auth);
  private dashboardService = inject(DashboardService);
  private toastService = inject(ToastService);

  // ===== REACTIVE STATE =====
  user = signal<User | null>(null);
  loading = signal(true);
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  dashboardData = signal<any>({
    transactions: [],
    recurringBills: [],
    pots: [],
    summary: { totalIncome: 0, totalExpense: 0, balance: 0 },
    categoryBreakdown: [],
    budgetStatus: [],
    potsStatus: [],
    upcomingBills: [],
    monthlyTrend: [],
    insights: [],
  });

  private unsubscribe: (() => void) | null = null;

  // ===== LIFECYCLE =====
  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user.set(user);
        this.loadDashboard();
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  // ===== PUBLIC METHODS =====
  changeMonth(month: number) {
    this.selectedMonth.set(month);
    this.loadDashboard();
  }

  changeYear(year: number) {
    this.selectedYear.set(year);
    this.loadDashboard();
  }

  onMonthChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.changeMonth(+value);
  }

  onYearChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.changeYear(+value);
  }

  // ===== PRIVATE METHODS =====
  private loadDashboard() {
    const userId = this.user()?.uid;
    if (!userId) return;

    this.loading.set(true);

    this.dashboardService
      .getDashboardData(userId, this.selectedMonth(), this.selectedYear())
      .then((data) => {
        this.dashboardData.set(data);
      })
      .catch((error) => {
        console.error('Erro ao carregar dashboard:', error);
        this.toastService.error('Erro ao carregar dados do dashboard');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }
}
