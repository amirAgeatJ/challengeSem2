import { TransactionCategory } from '../type/transaction-categorie-type'
import { TransactionType } from '../type/transaction-type'


export interface Transaction {
  id?: number;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  location: string;
  date: Date;
}