import { Injectable, inject } from '@angular/core';
import { TransactionsService } from './transactions.service';
import { RecurringBillsService } from './recurring-bill.service';
import { PotsService } from './pots.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private transactionsService = inject(TransactionsService);
  private billsService = inject(RecurringBillsService);
  private potsService = inject(PotsService);

  /**
   * Retorna todos os dados do dashboard
   */
  getDashboardData(userId: string, month: number, year: number): Promise<any> {
    return new Promise((resolve) => {
      let transactions: any[] = [];
      let recurringBills: any[] = [];
      let pots: any[] = [];

      let dataLoaded = 0;

      // Transactions
      this.transactionsService.listen(userId, (txs) => {
        transactions = this.filterByMonth(txs, month, year);
        if (++dataLoaded === 3) resolveData();
      });

      // Bills
      this.billsService.listen(userId, (bills) => {
        recurringBills = bills;
        if (++dataLoaded === 3) resolveData();
      });

      // Pots
      this.potsService.listen(userId, (p) => {
        pots = p;
        if (++dataLoaded === 3) resolveData();
      });

      const resolveData = () => {
        resolve({
          transactions,
          recurringBills,
          pots,

          summary: this.getMonthlyOverview(transactions),
          categoryBreakdown: this.getCategoryBreakdown(transactions),
          budgetStatus: this.getBudgetStatus(transactions, []),
          potsStatus: this.getPotsStatus(pots),
          upcomingBills: this.getUpcomingBills(recurringBills, 5),
          monthlyTrend: this.getTrendAnalysis(transactions),
          insights: this.generateInsights(transactions, [], recurringBills, pots),
        });
      };
    });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private filterByMonth(transactions: any[], month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return transactions.filter((tx) => {
      const txDate = tx.date?.toDate?.() ?? new Date(tx.date);

      return txDate >= startDate && txDate <= endDate;
    });
  }

  /**
   * Receita, despesa e saldo
   */
  getMonthlyOverview(transactions: any[]) {
    const totalIncome = transactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + (+tx.amount || 0), 0);

    const totalExpense = Math.abs(
      transactions
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum - (+tx.amount || 0), 0),
    );

    const balance = transactions.reduce(
      (sum, tx) => sum + (tx.type === 'INCOME' ? +tx.amount : -(+tx.amount || 0)),
      0,
    );

    return { totalIncome, totalExpense, balance };
  }

  /**
   * Gastos por categoria
   */
  getCategoryBreakdown(transactions: any[]) {
    const breakdown: Record<string, any> = {};

    transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => {
        const category = tx.category || 'Uncategorized';

        if (!breakdown[category]) {
          breakdown[category] = {
            name: category,
            amount: 0,
            count: 0,
            percentage: 0,
          };
        }

        breakdown[category].amount += +tx.amount || 0;
        breakdown[category].count++;
      });

    const totalExpense = Object.values(breakdown).reduce(
      (sum: number, b: any) => sum + b.amount,
      0,
    );

    Object.values(breakdown).forEach((b: any) => {
      b.percentage = totalExpense > 0 ? Math.round((b.amount / totalExpense) * 100) : 0;
    });

    return Object.values(breakdown).sort((a: any, b: any) => b.amount - a.amount);
  }

  /**
   * Budgets — placeholder
   */
  getBudgetStatus(transactions: any[], budgets: any[]) {
    return [];
  }

  /**
   * Status dos pots
   */
  getPotsStatus(pots: any[]) {
    return (pots || []).map((pot) => {
      const current = +pot.currentAmount || 0;
      const target = +pot.targetAmount || 0;

      const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

      let status = 'STARTING';

      if (percentage >= 100) status = 'COMPLETED';
      else if (percentage >= 75) status = 'NEAR_GOAL';
      else if (percentage >= 50) status = 'HALF_WAY';

      return {
        id: pot.id,
        name: pot.name,
        color: pot.color,
        currentAmount: current,
        targetAmount: target,
        remaining: Math.max(0, target - current),
        percentage,
        status,
      };
    });
  }

  /**
   * Próximas contas
   */
  getUpcomingBills(bills: any[], limit: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bills
      .filter((b) => b.isActive)
      .map((b) => {
        const dueDate = b.nextDueDate?.toDate?.() ?? new Date(b.nextDueDate);

        const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

        let status = 'UPCOMING';

        if (days < 0) status = 'OVERDUE';
        else if (days === 0) status = 'DUE_TODAY';
        else if (days <= 7) status = 'SOON';

        return {
          id: b.id,
          name: b.name,
          amount: b.amount,
          currency: b.currency,
          dueDate,
          daysUntilDue: days,
          status,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, limit);
  }

  /**
   * Tendência últimos 6 meses
   */
  getTrendAnalysis(transactions: any[]) {
    const months: Record<string, any> = {};
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months[key] = { income: 0, expense: 0, balance: 0 };
    }

    transactions.forEach((tx) => {
      const txDate = tx.date?.toDate?.() ?? new Date(tx.date);

      const key = txDate.toISOString().slice(0, 7);

      if (!months[key]) return;

      if (tx.type === 'INCOME') months[key].income += +tx.amount || 0;
      else months[key].expense += +tx.amount || 0;

      months[key].balance = months[key].income - months[key].expense;
    });

    return Object.entries(months).map(([month, data]: any) => ({
      month,
      ...data,
    }));
  }

  /**
   * Insights
   */
  generateInsights(transactions: any[], budgets: any[], bills: any[], pots: any[]) {
    const insights: any[] = [];

    const category = this.getCategoryBreakdown(transactions);
    const potsStatus = this.getPotsStatus(pots);

    if (category.length > 0) {
      insights.push({
        type: 'TOP_CATEGORY',
        title: 'Top Spending Category',
        message: `${category[0].name} is your highest spending category this month`,
        value: category[0].amount,
        percentage: category[0].percentage,
      });
    }

    const overdue = bills.filter((b) => {
      const d = b.nextDueDate?.toDate?.() ?? new Date(b.nextDueDate);
      return d < new Date();
    });

    if (overdue.length > 0) {
      insights.push({
        type: 'OVERDUE_BILLS',
        title: 'Overdue Bills',
        message: `You have ${overdue.length} overdue bill(s)`,
      });
    }

    const nearGoal = potsStatus.filter((p) => p.status === 'NEAR_GOAL' || p.status === 'COMPLETED');

    if (nearGoal.length > 0) {
      insights.push({
        type: 'POTS_NEAR_GOAL',
        title: 'Savings Goal Progress',
        message: `You have ${nearGoal.length} pot(s) near or completed their goal`,
      });
    }

    const totalSaved = (pots || []).reduce((s, p) => s + (+p.currentAmount || 0), 0);

    if (totalSaved > 0) {
      insights.push({
        type: 'TOTAL_SAVINGS',
        title: 'Total Saved',
        value: totalSaved,
      });
    }

    return insights;
  }
}
