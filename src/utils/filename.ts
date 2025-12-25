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
 * Format: {hour}-{minute}-{second}
 */
function generateTimestamp(date: Date = new Date()): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${hour}-${minute}-${second}`;
}

/**
 * Generate a filename for the PDF file
 * Format: {requestedKey}__{hour}-{minute}-{second}.pdf
 * Note: Files are stored in dd-mm-yyyy date folders
 */
export function generatePdfFilename(requestedKey: string, date: Date = new Date()): string {
  return `${requestedKey}__${generateTimestamp(date)}.pdf`;
}

/**
 * Generate a filename for error screenshots
 * Format: {requestedKey}__error__{hour}-{minute}-{second}.png
 * Note: Files are stored in dd-mm-yyyy date folders
 */
export function generateErrorScreenshotFilename(requestedKey: string, date: Date = new Date()): string {
  return `${requestedKey}__error__${generateTimestamp(date)}.png`;
}

/**
 * Parse a PDF filename and folder to extract requestedKey and timestamp
 * @param filename - The PDF filename (e.g., "my-key__14-30-45.pdf")
 * @param dateFolder - The date folder (e.g., "25-12-2025")
 */
export function parsePdfFilename(
  filename: string,
  dateFolder?: string
): {
  requestedKey: string;
  timestamp: Date;
} | null {
  const match = filename.match(/^(.+)__(\d{2})-(\d{2})-(\d{2})\.pdf$/);

  if (!match) return null;

  const [, requestedKey, hour, minute, second] = match;

  if (!requestedKey) return null;

  // Parse date from folder if provided, otherwise use today
  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  let day = new Date().getDate();

  if (dateFolder) {
    const folderMatch = dateFolder.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (folderMatch) {
      day = parseInt(folderMatch[1]!, 10);
      month = parseInt(folderMatch[2]!, 10) - 1;
      year = parseInt(folderMatch[3]!, 10);
    }
  }

  return {
    requestedKey,
    timestamp: new Date(
      year,
      month,
      day,
      parseInt(hour!, 10),
      parseInt(minute!, 10),
      parseInt(second!, 10)
    ),
  };
}
