/**
 * Treatment Plan Utility Functions
 * Handles currency formatting, quarterly calculations, and progress tracking
 */

// Currency formatting with locale support
export const formatCurrency = (value: string | number): string => {
  if (!value) return "";

  const numValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;

  if (isNaN(numValue)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

// Parse currency string back to number
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.]/g, ""));
};

// Quarter type definition
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

// Get quarter from month (1-12)
export const getQuarterFromMonth = (month: number): Quarter => {
  if (month >= 1 && month <= 3) return "Q1";
  if (month >= 4 && month <= 6) return "Q2";
  if (month >= 7 && month <= 9) return "Q3";
  return "Q4";
};

// Get start and end dates for a quarter
export const getQuarterDateRange = (
  year: number,
  quarter: Quarter
): { startDate: Date; endDate: Date } => {
  let startMonth = 0;
  let endMonth = 0;

  switch (quarter) {
    case "Q1":
      startMonth = 0; // January
      endMonth = 2; // March
      break;
    case "Q2":
      startMonth = 3; // April
      endMonth = 5; // June
      break;
    case "Q3":
      startMonth = 6; // July
      endMonth = 8; // September
      break;
    case "Q4":
      startMonth = 9; // October
      endMonth = 11; // December
      break;
  }

  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth + 1, 0); // Last day of end month

  return { startDate, endDate };
};

// Calculate progress percentage based on current date
export const calculateQuarterProgress = (year: number, quarter: Quarter): number => {
  const { startDate, endDate } = getQuarterDateRange(year, quarter);
  const today = new Date();

  // If before quarter start, progress is 0
  if (today < startDate) return 0;

  // If after quarter end, progress is 100
  if (today > endDate) return 100;

  // Calculate progress within the quarter
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const elapsedDays = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const progress = Math.min(Math.round((elapsedDays / totalDays) * 100), 100);
  return progress;
};

// Format quarter display string
export const formatQuarterDisplay = (year: number, quarter: Quarter): string => {
  return `${quarter} ${year}`;
};

// Get quarter label with date range
export const getQuarterLabel = (year: number, quarter: Quarter): string => {
  const { startDate, endDate } = getQuarterDateRange(year, quarter);
  const startFormatted = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFormatted = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${quarter} ${year} (${startFormatted} - ${endFormatted})`;
};

// Get available years (current year and next 5 years)
export const getAvailableYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => currentYear + i);
};

// Determine if residual scoring should be enabled based on progress
export const isResidualScoringEnabled = (progress: number): boolean => {
  return progress >= 70;
};
