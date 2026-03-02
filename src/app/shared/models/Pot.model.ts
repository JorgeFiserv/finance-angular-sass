export interface Pot {
  id?: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number | null;
  color?: string;
  createdAt?: any;
}
