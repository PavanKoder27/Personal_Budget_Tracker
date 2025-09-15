export interface User {
  id: string;
  username: string;
  email: string;
  token?: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  // Optional recurrence/template metadata (added for recurring transactions)
  isTemplate?: boolean;
  recurrence?: {
    active: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number; // every N units of frequency
    nextRunAt?: string; // ISO timestamp of next generation time
    occurrencesLeft?: number | null; // null means infinite
    endDate?: string | null; // ISO date when recurrence stops
  };
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  // Recurrence/template controls
  isTemplate?: boolean;
  recurrence?: {
    active: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    nextRunAt?: string; // derived from date for first run
    occurrencesLeft?: number | null;
    endDate?: string | null;
  };
}

export interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction;
}

// Added: Budget related types
export interface Budget {
  _id?: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

export interface BudgetStatusItem {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number; // 0-100
}

// Added: Group related types
export interface GroupMember {
  _id?: string; // mongo subdocument id for member
  user: string; // user id (may be placeholder)
  name: string;
  email?: string; // if populated user ref has email
  isAdmin?: boolean;
  isPlaceholder?: boolean; // true if member created without real user account
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdBy: string;
  createdAt?: string;
}

export interface GroupExpenseSplit {
  user: string; // user id
  amount: number;
}

export interface GroupExpense {
  _id?: string;
  group: string; // group id
  paidBy: string; // user id
  amount: number;
  description: string;
  splits: GroupExpenseSplit[];
  date?: string;
}

export interface GroupSettlement {
  _id?: string;
  group: string;
  paidBy: string;
  paidTo: string;
  amount: number;
  date?: string;
}

// Savings Goal types
export interface Goal {
  _id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  deadline?: string; // ISO date
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Anomaly transaction lightweight type
export interface AnomalyTransaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  anomaly?: { isAnomaly: boolean; score: number; reason?: string };
}

export type GroupBalances = Record<string, number>; // userId -> net balance
