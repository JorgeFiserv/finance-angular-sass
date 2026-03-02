export interface CategorySummary {
  category: string;
  income: number;
  expense: number;
}

export interface PieChartData {
  labels: string[];
  data: number[];
}

export interface Transaction {
  type: 'INCOME' | 'EXPENSE';
  amount: number | null;
  category: string;
}
