import { Component, OnInit, OnDestroy, signal, inject, effect, computed } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import { TransactionsService } from '../../core/services/transactions.service';
import { Auth, authState } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

// Registrar plugins do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, PieController);

interface CategorySummary {
  category: string;
  income: number;
  expense: number;
  percentageOfIncome: number;
  percentageOfExpense: number;
}

@Component({
  selector: 'app-budgets',
  imports: [CurrencyPipe, NgClass, BaseChartDirective],
  templateUrl: './budgets.html',
  styleUrl: './budgets.scss',
})
export class Budgets implements OnInit, OnDestroy {
  private transactionsService = inject(TransactionsService);
  private auth = inject(Auth);

  user = toSignal(authState(this.auth), { initialValue: null });
  transactions = signal<any[]>([]);
  private unsubscribe: (() => void) | null = null;

  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());
  availableYears = signal<number[]>([]);

  summary = signal<CategorySummary[]>([]);
  expenseSummary = computed(() => this.summary().filter((item) => item.expense > 0));
  totalIncome = signal(0);
  totalExpense = signal(0);
  remaining = signal(0);
  budgetUsedPercentage = signal(0);
  hiddenCategories = signal<Set<string>>(new Set());

  // Pie chart data
  categoryColors = [
    'rgba(59, 130, 246, 0.8)', // blue
    'rgba(10, 184, 154, 0.8)', // teal
    'rgba(239, 68, 68, 0.8)', // red
    'rgba(249, 115, 22, 0.8)', // orange
    'rgba(168, 85, 247, 0.8)', // purple
    'rgba(236, 72, 153, 0.8)', // pink
    'rgba(34, 197, 94, 0.8)', // green
    'rgba(14, 165, 233, 0.8)', // sky
  ];

  pieChartData = signal<ChartConfiguration<'pie'>['data']>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  });

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const totalIncome = this.totalIncome();
            const percentOfBudget =
              totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1).replace('.', ',') : '0';
            return `${label}: R$ ${value.toFixed(2).replace('.', ',')} (${percentOfBudget}% do orçamento)`;
          },
        },
      },
    },
  };

  months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  constructor() {
    effect(() => {
      const user = this.user();
      this.cleanup();
      if (user) {
        this.unsubscribe = this.transactionsService.listen(user.uid, (transactions) => {
          this.transactions.set(transactions);
          this.setAvailableYears();
          this.applyFilters();
        });
      }
    });

    effect(() => {
      this.applyFilters();
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  changeMonth(month: number) {
    this.selectedMonth.set(month);
  }

  changeYear(year: number) {
    this.selectedYear.set(year);
  }

  toggleCategory(category: string) {
    const hidden = new Set(this.hiddenCategories());
    if (hidden.has(category)) {
      hidden.delete(category);
    } else {
      hidden.add(category);
    }
    this.hiddenCategories.set(hidden);
    this.updatePieChart(this.summary());
  }

  isCategoryVisible(category: string): boolean {
    return !this.hiddenCategories().has(category);
  }

  getCategoryColor(index: number): string {
    return this.categoryColors[index % this.categoryColors.length];
  }

  parseNumber(value: any): number {
    return parseInt(value, 10);
  }

  private setAvailableYears() {
    const yearSet = new Set<number>();

    this.transactions().forEach((tx) => {
      const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      if (!isNaN(txDate.getTime())) {
        yearSet.add(txDate.getFullYear());
      }
    });

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      yearSet.add(currentYear - i);
    }

    const years = Array.from(yearSet).sort((a, b) => b - a);
    this.availableYears.set(years);

    if (!years.includes(this.selectedYear())) {
      this.selectedYear.set(years[0]);
    }
  }

  private applyFilters() {
    const filtered = this.filterByMonth();
    let builtSummary = this.buildCategorySummary(filtered);

    // Calcular totais
    const totalIncome = builtSummary.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = builtSummary.reduce((sum, item) => sum + item.expense, 0);

    // Calcular percentagens
    builtSummary = builtSummary.map((item) => ({
      ...item,
      percentageOfIncome: totalIncome > 0 ? +((item.expense / totalIncome) * 100).toFixed(1) : 0,
      percentageOfExpense: totalExpense > 0 ? +((item.expense / totalExpense) * 100).toFixed(1) : 0,
    }));

    this.summary.set(builtSummary);
    this.totalIncome.set(totalIncome);
    this.totalExpense.set(totalExpense);
    this.remaining.set(totalIncome - totalExpense);
    this.budgetUsedPercentage.set(
      totalIncome > 0 ? +((totalExpense / totalIncome) * 100).toFixed(1) : 0,
    );

    // Update pie chart data
    this.updatePieChart(builtSummary);
  }

  private updatePieChart(summary: CategorySummary[]) {
    const expenseSummary = summary.filter((item) => item.expense > 0);
    const hidden = this.hiddenCategories();
    const colorMap = new Map(
      expenseSummary.map((item, index) => [item.category, this.getCategoryColor(index)]),
    );
    const visibleSummary = expenseSummary.filter((item) => !hidden.has(item.category));

    if (visibleSummary.length === 0) {
      this.pieChartData.set({
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderColor: 'white',
            borderWidth: 2,
          },
        ],
      });
      return;
    }

    const chartData: ChartConfiguration<'pie'>['data'] = {
      labels: visibleSummary.map((item) => item.category),
      datasets: [
        {
          data: visibleSummary.map((item) => item.expense),
          backgroundColor: visibleSummary.map(
            (item) => colorMap.get(item.category) || 'rgba(59, 130, 246, 0.8)',
          ),
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
    };

    this.pieChartData.set(chartData);
  }

  private filterByMonth() {
    const startDate = new Date(this.selectedYear(), this.selectedMonth() - 1, 1);
    const endDate = new Date(this.selectedYear(), this.selectedMonth(), 0, 23, 59, 59, 999);

    return this.transactions().filter((tx) => {
      const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }

  private buildCategorySummary(transactions: any[]): CategorySummary[] {
    const summary: { [key: string]: CategorySummary } = {};

    transactions.forEach((tx) => {
      const category = tx.category || 'Geral';
      const amount = Number(tx.amount) || 0;

      if (!summary[category]) {
        summary[category] = {
          category,
          income: 0,
          expense: 0,
          percentageOfIncome: 0,
          percentageOfExpense: 0,
        };
      }

      if (tx.type === 'INCOME') {
        summary[category].income += amount;
      } else if (tx.type === 'EXPENSE') {
        summary[category].expense += amount;
      }
    });

    return Object.values(summary).filter((item) => item.income > 0 || item.expense > 0);
  }
}
