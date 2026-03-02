export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringBill {
  id?: string;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  category?: string;
  frequency: Frequency;
  nextDueDate: Date;
  isActive: boolean;
  autoDebit?: boolean;
  createdAt?: any;
  updatedAt?: any;
}
