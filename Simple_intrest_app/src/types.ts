export interface CalculationResult {
  principal: number;
  rate: number; // e.g. 2 means ₹2 per 100 per month
  startDate: string;
  endDate: string;
  durationYears: number;
  durationMonths: number;
  durationDays: number;
  totalMonths: number;
  totalDays: number; // raw days
  monthlyInterest: number;
  totalInterest: number;
  totalAmount: number;
  equivalentAnnualRate: number; // rate * 12
}

export interface HistoryItem {
  id: string;
  title: string;
  dateCreated: string;
  result: CalculationResult;
  notes?: string;
}

export interface DashboardStats {
  totalCalculations: number;
  totalPrincipal: number;
  totalInterestAccumulated: number;
  averageRate: number;
}
