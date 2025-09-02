/**
 * Utility functions for safe date serialization
 * Handles cases where dates might already be strings or Date objects
 */

/**
 * Safely converts a date value to ISO string format
 * @param date - Date object, string, or any other value
 * @returns ISO string or null if conversion not possible
 */
export function toISOStringOrNull(date: any): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date; // Already a string
  if (date instanceof Date) return date.toISOString();
  // If it's an object with toISOString method, call it
  if (typeof date === 'object' && typeof date.toISOString === 'function') {
    return date.toISOString();
  }
  return null;
}

/**
 * Safely converts multiple date fields in an object
 * @param obj - Object containing date fields
 * @param fields - Array of field names to convert
 * @returns New object with converted date fields
 */
export function serializeDateFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const serialized = { ...obj };
  
  for (const field of fields) {
    if (field in serialized) {
      serialized[field] = toISOStringOrNull(serialized[field]) as T[typeof field];
    }
  }
  
  return serialized;
}
