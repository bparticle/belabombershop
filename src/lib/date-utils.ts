/**
 * Utility functions for consistent date formatting across server and client
 * This helps prevent hydration mismatches
 */

/**
 * Format a date consistently for display
 * Uses en-US locale with specific options to ensure server/client consistency
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Format a date for display without seconds (shorter format)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a date for display with only the date (no time)
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
