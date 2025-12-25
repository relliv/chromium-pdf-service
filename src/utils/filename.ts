/**
 * Generate a timestamp string for filenames
 * Format: {year}-{month}-{day}-{hour}-{minute}-{second}
 */
function generateTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hour}-${minute}-${second}`;
}

/**
 * Generate a filename for the PDF file
 * Format: {requestedKey}__{year}-{month}-{day}-{hour}-{minute}-{second}.pdf
 */
export function generatePdfFilename(requestedKey: string, date: Date = new Date()): string {
  return `${requestedKey}__${generateTimestamp(date)}.pdf`;
}

/**
 * Generate a filename for error screenshots
 * Format: {requestedKey}__error__{year}-{month}-{day}-{hour}-{minute}-{second}.png
 */
export function generateErrorScreenshotFilename(requestedKey: string, date: Date = new Date()): string {
  return `${requestedKey}__error__${generateTimestamp(date)}.png`;
}

/**
 * Parse a PDF filename to extract requestedKey and timestamp
 */
export function parsePdfFilename(filename: string): {
  requestedKey: string;
  timestamp: Date;
} | null {
  const match = filename.match(/^(.+)__(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\.pdf$/);

  if (!match) return null;

  const [, requestedKey, year, month, day, hour, minute, second] = match;

  if (!requestedKey) return null;

  return {
    requestedKey,
    timestamp: new Date(
      parseInt(year!, 10),
      parseInt(month!, 10) - 1,
      parseInt(day!, 10),
      parseInt(hour!, 10),
      parseInt(minute!, 10),
      parseInt(second!, 10)
    ),
  };
}
