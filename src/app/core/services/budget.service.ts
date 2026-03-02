import { Injectable } from '@angular/core';
import { Transaction, CategorySummary, PieChartData } from '../../shared/models/budget.model';
@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  buildCategorySummary(transactions: Transaction[]): CategorySummary[] {
    const summary: Record<string, CategorySummary> = {};
    for (const tx of transactions) {
      const amount = Number(tx.amount || 0);
      if (!summary[tx.category]) {
        summary[tx.category] = {
          category: tx.category,
          income: 0,
          expense: 0,
        };
      }
      if (tx.type === 'INCOME') {
        summary[tx.category].income += amount;
      } else if (tx.type === 'EXPENSE') {
        summary[tx.category].expense += amount;
      }
    }
    return Object.values(summary);
  }
  toPieChartData(categorySummary: CategorySummary[]): PieChartData {
    return {
      labels: categorySummary.map((s) => s.category),
      data: categorySummary.map((s) => s.expense), // Focando apenas em despesas para o gráfico
    };
  }
}
