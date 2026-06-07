import { CalculationResult } from "../types";

export function calculateDetailedDateDifference(startDateStr: string, endDateStr: string) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { years: 0, months: 0, days: 0, totalMonths: 0, totalDays: 0 };
  }

  // Set times to midnight to avoid timezone hour shifts
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (s > e) {
    return { years: 0, months: 0, days: 0, totalMonths: 0, totalDays: 0 };
  }

  let years = e.getFullYear() - s.getFullYear();
  let months = e.getMonth() - s.getMonth();
  let days = e.getDate() - s.getDate();

  if (days < 0) {
    months -= 1;
    // Get total days in s's month or e's previous month to represent the borrowed days
    const prevMonth = new Date(e.getFullYear(), e.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // total months formulation
  // Traditional regional rule: total months = items in years * 12 + items in months + (days / 30)
  const totalMonths = (years * 12) + months + (days / 30);
  const totalDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

  return {
    years,
    months,
    days,
    totalMonths: Number(totalMonths.toFixed(4)),
    totalDays
  };
}

export function calculateSimpleInterest(
  principal: number,
  ratePerHundredPerMonth: number,
  startDateStr: string,
  endDateStr: string
): CalculationResult {
  const diff = calculateDetailedDateDifference(startDateStr, endDateStr);
  
  // Rule: Monthly Rate = Rate per Hundred per Month = ratePerHundredPerMonth / 100
  const monthlyRate = ratePerHundredPerMonth / 100;
  const monthlyInterest = principal * monthlyRate;
  const totalInterest = monthlyInterest * diff.totalMonths;
  const totalAmount = principal + totalInterest;
  const equivalentAnnualRate = ratePerHundredPerMonth * 12;

  return {
    principal,
    rate: ratePerHundredPerMonth,
    startDate: startDateStr,
    endDate: endDateStr,
    durationYears: diff.years,
    durationMonths: diff.months,
    durationDays: diff.days,
    totalMonths: diff.totalMonths,
    totalDays: diff.totalDays,
    monthlyInterest: Number(monthlyInterest.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    equivalentAnnualRate: Number(equivalentAnnualRate.toFixed(2))
  };
}
