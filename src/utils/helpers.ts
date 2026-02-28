// Helper function to validate day, month, and year
export const validateDate = (date: string): boolean => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(date)) {
    return false;
  }

  const [, day, month, year] = date.match(regex) || [];
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  // Ensure day, month, and year are valid
  const isValidDay = dayNum >= 1 && dayNum <= 31;
  const isValidMonth = monthNum >= 1 && monthNum <= 12;

  // Optional: Validate year (e.g., reasonable range)
  const isValidYear = yearNum >= 1900 && yearNum <= new Date().getFullYear();

  return isValidDay && isValidMonth && isValidYear;
};

export const formatValue = (
  value: any,
  decimalPlaces: number = 0,
  isPercentage: boolean = false,
) => {
  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') return '0';

  // Convert to number if it's a string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN cases
  if (isNaN(numericValue)) return '0';

  // Format as percentage if needed
  if (isPercentage) {
    return `${numericValue.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}%`;
  }

  // Format as regular number with 2 decimal places
  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};
