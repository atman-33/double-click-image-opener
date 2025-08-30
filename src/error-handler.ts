import { Notice } from 'obsidian';

/**
 * Error message constants for consistent user feedback
 */
const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'Image file not found: {path}',
  PERMISSION_DENIED: 'Permission denied when trying to open image',
  SYSTEM_ERROR: 'Failed to open image with default application',
  PATH_RESOLUTION_FAILED: 'Could not resolve image path',
  INVALID_IMAGE_FORMAT: 'Unsupported image format or corrupted file',
  SYSTEM_COMMAND_FAILED: 'System command failed to execute',
} as const;

/**
 * Error types for categorizing different error scenarios
 */
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  PATH_RESOLUTION_FAILED = 'PATH_RESOLUTION_FAILED',
  INVALID_IMAGE_FORMAT = 'INVALID_IMAGE_FORMAT',
  SYSTEM_COMMAND_FAILED = 'SYSTEM_COMMAND_FAILED',
}

/**
 * ErrorHandler class provides centralized error handling and user feedback
 * for the Double-Click Image Opener plugin
 */
export class ErrorHandler {
  /**
   * Handle file not found errors
   * @param imagePath - The path of the image that was not found
   */
  public static handleFileNotFound(imagePath: string): void {
    const message = ERROR_MESSAGES.FILE_NOT_FOUND.replace('{path}', imagePath);
    new Notice(message, 5000);
    console.error(`[Double-Click Image Opener] File not found: ${imagePath}`);
  }

  /**
   * Handle permission denied errors
   * @param error - The original error object
   * @param imagePath - Optional path for additional context
   */
  public static handlePermissionError(error: Error, imagePath?: string): void {
    const message = ERROR_MESSAGES.PERMISSION_DENIED;
    new Notice(message, 5000);
    console.error(`[Double-Click Image Opener] Permission denied:`, error);
    if (imagePath) {
      console.error(`[Double-Click Image Opener] Image path: ${imagePath}`);
    }
  }

  /**
   * Handle general system errors when launching applications
   * @param error - The original error object
   * @param imagePath - Optional path for additional context
   */
  public static handleSystemError(error: Error, imagePath?: string): void {
    const message = ERROR_MESSAGES.SYSTEM_ERROR;
    new Notice(message, 5000);
    console.error(`[Double-Click Image Opener] System error:`, error);
    if (imagePath) {
      console.error(`[Double-Click Image Opener] Image path: ${imagePath}`);
    }
  }

  /**
   * Handle path resolution failures
   * @param originalPath - The original path that failed to resolve
   */
  public static handlePathResolutionError(originalPath: string): void {
    const message = ERROR_MESSAGES.PATH_RESOLUTION_FAILED;
    new Notice(message, 5000);
    console.error(
      `[Double-Click Image Opener] Path resolution failed for: ${originalPath}`,
    );
  }

  /**
   * Handle invalid image format errors
   * @param imagePath - The path of the invalid image
   */
  public static handleInvalidImageFormat(imagePath: string): void {
    const message = ERROR_MESSAGES.INVALID_IMAGE_FORMAT;
    new Notice(message, 5000);
    console.error(
      `[Double-Click Image Opener] Invalid image format: ${imagePath}`,
    );
  }

  /**
   * Handle system command execution failures
   * @param command - The command that failed to execute
   * @param error - The original error object
   */
  public static handleSystemCommandError(command: string, error: Error): void {
    const message = ERROR_MESSAGES.SYSTEM_COMMAND_FAILED;
    new Notice(message, 5000);
    console.error(
      `[Double-Click Image Opener] Command failed: ${command}`,
      error,
    );
  }

  /**
   * Generic error handler for unexpected errors
   * @param error - The error object
   * @param context - Additional context about where the error occurred
   */
  public static handleGenericError(error: Error, context?: string): void {
    const message = 'An unexpected error occurred while opening the image';
    new Notice(message, 5000);
    console.error(
      `[Double-Click Image Opener] Unexpected error${context ? ` in ${context}` : ''}:`,
      error,
    );
  }

  /**
   * Format error message by replacing placeholders
   * @param template - The message template with placeholders
   * @param replacements - Object containing replacement values
   * @returns Formatted message string
   */
  private static formatMessage(
    template: string,
    replacements: Record<string, string>,
  ): string {
    let formatted = template;
    for (const [key, value] of Object.entries(replacements)) {
      formatted = formatted.replace(`{${key}}`, value);
    }
    return formatted;
  }

  /**
   * Check if an error is a permission-related error
   * @param error - The error to check
   * @returns True if the error is permission-related
   */
  public static isPermissionError(error: Error): boolean {
    const permissionKeywords = [
      'EACCES',
      'EPERM',
      'permission denied',
      'access denied',
    ];
    const errorMessage = error.message.toLowerCase();
    return permissionKeywords.some((keyword) =>
      errorMessage.includes(keyword.toLowerCase()),
    );
  }

  /**
   * Check if an error is a file not found error
   * @param error - The error to check
   * @returns True if the error is file not found
   */
  public static isFileNotFoundError(error: Error): boolean {
    const notFoundKeywords = ['ENOENT', 'file not found', 'no such file'];
    const errorMessage = error.message.toLowerCase();
    return notFoundKeywords.some((keyword) =>
      errorMessage.includes(keyword.toLowerCase()),
    );
  }
}
