import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a UUID v4 string.
 * Compatible with Postgres UUID type.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Returns the current timestamp in ISO 8601 format.
 * Compatible with Postgres TIMESTAMP type.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Formats a number as currency (USD).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a number as currency with cents.
 */
export function formatCurrencyWithCents(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a percentage value.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a number with commas for display.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Parses a currency string to a number.
 * Handles formats like "$1,234.56" or "1234.56".
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converts camelCase to snake_case.
 * Used for database column mapping.
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts snake_case to camelCase.
 * Used for database row mapping.
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts an object's keys from camelCase to snake_case.
 */
export function objectToSnakeCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[camelToSnake(key)] = obj[key];
    }
  }
  return result;
}

/**
 * Converts an object's keys from snake_case to camelCase.
 */
export function objectToCamelCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[snakeToCamel(key)] = obj[key];
    }
  }
  return result;
}

/**
 * Validates that a value is a valid positive number.
 */
export function isValidPositiveNumber(value: unknown): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && value >= 0;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && parsed >= 0;
  }
  return false;
}

/**
 * Clamps a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the percentage of a value relative to a total.
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Groups an array of objects by a key.
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sums an array of numbers.
 */
export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Debounces a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Formats a date/time string for display.
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

