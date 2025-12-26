/**
 * Generate a date folder name
 * Format: dd-mm-yyyy
 */
export function generateDateFolder(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
}

/**
 * Generate a timestamp string for filenames
 * Format: {day}-{month}-{year}_{hour}-{minute}-{second}
 */
function generateTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year}_${hour}-${minute}-${second}`;
}

/**
 * Generate a filename for the PDF file
 * Format: {requestedKey}__{day}-{month}-{year}_{hour}-{minute}-{second}.pdf
 * Note: Files are stored in dd-mm-yyyy date folders
 */
export function generatePdfFilename(requestedKey: string, date: Date = new Date()): string {
  return `${requestedKey}__${generateTimestamp(date)}.pdf`;
}

/**
 * Generate a filename for error screenshots
 * Format: {requestedKey}__error__{day}-{month}-{year}_{hour}-{minute}-{second}.png
 * Note: Files are stored in dd-mm-yyyy date folders
 */
export function generateErrorScreenshotFilename(requestedKey: string, date: Date = new Date()): string {
  return `${requestedKey}__error__${generateTimestamp(date)}.png`;
}

/**
 * Parse a PDF filename to extract requestedKey and timestamp
 * @param filename - The PDF filename (e.g., "my-key__25-12-2025_14-30-45.pdf")
 */
export function parsePdfFilename(filename: string): {
  requestedKey: string;
  timestamp: Date;
} | null {
  const match = filename.match(/^(.+)__(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})\.pdf$/);

  if (!match) return null;

  const [, requestedKey, day, month, year, hour, minute, second] = match;

  if (!requestedKey || !day || !month || !year || !hour || !minute || !second) {
    return null;
  }

  return {
    requestedKey,
    timestamp: new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10)
    ),
  };
}
