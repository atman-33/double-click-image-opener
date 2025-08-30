import { Notice } from 'obsidian';

/**
 * Interface for plugin settings used by ErrorHandler
 */
interface PluginSettings {
  showSuccessNotifications: boolean;
  enableDebugLogging: boolean;
}

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
 * ErrorHandler namespace provides centralized error handling and user feedback
 * for the Double-Click Image Opener plugin
 */
export namespace ErrorHandler {
  let settings: PluginSettings | null = null;

  /**
   * Initialize the ErrorHandler with plugin settings
   * @param pluginSettings - Plugin settings for controlling notifications and logging
   */
  export function initialize(pluginSettings: PluginSettings): void {
    settings = pluginSettings;
  }
  /**
   * Handle successful image opening
   * @param imagePath - The path of the image that was successfully opened
   */
  export function handleSuccess(imagePath: string): void {
    if (settings?.showSuccessNotifications) {
      new Notice(`Image opened successfully: ${imagePath}`, 3000);
    }
    if (settings?.enableDebugLogging) {
      console.log(
        `[Double-Click Image Opener] Successfully opened: ${imagePath}`,
      );
    }
  }

  /**
   * Handle file not found errors
   * @param imagePath - The path of the image that was not found
   */
  export function handleFileNotFound(imagePath: string): void {
    const message = ERROR_MESSAGES.FILE_NOT_FOUND.replace('{path}', imagePath);
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(`[Double-Click Image Opener] File not found: ${imagePath}`);
    }
  }

  /**
   * Handle permission denied errors
   * @param error - The original error object
   * @param imagePath - Optional path for additional context
   */
  export function handlePermissionError(
    error: Error,
    imagePath?: string,
  ): void {
    const message = ERROR_MESSAGES.PERMISSION_DENIED;
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(`[Double-Click Image Opener] Permission denied:`, error);
      if (imagePath) {
        console.error(`[Double-Click Image Opener] Image path: ${imagePath}`);
      }
    }
  }

  /**
   * Handle general system errors when launching applications
   * @param error - The original error object
   * @param imagePath - Optional path for additional context
   */
  export function handleSystemError(error: Error, imagePath?: string): void {
    const message = ERROR_MESSAGES.SYSTEM_ERROR;
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(`[Double-Click Image Opener] System error:`, error);
      if (imagePath) {
        console.error(`[Double-Click Image Opener] Image path: ${imagePath}`);
      }
    }
  }

  /**
   * Handle path resolution failures
   * @param originalPath - The original path that failed to resolve
   */
  export function handlePathResolutionError(originalPath: string): void {
    const message = ERROR_MESSAGES.PATH_RESOLUTION_FAILED;
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(
        `[Double-Click Image Opener] Path resolution failed for: ${originalPath}`,
      );
    }
  }

  /**
   * Handle invalid image format errors
   * @param imagePath - The path of the invalid image
   */
  export function handleInvalidImageFormat(imagePath: string): void {
    const message = ERROR_MESSAGES.INVALID_IMAGE_FORMAT;
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(
        `[Double-Click Image Opener] Invalid image format: ${imagePath}`,
      );
    }
  }

  /**
   * Handle system command execution failures
   * @param command - The command that failed to execute
   * @param error - The original error object
   */
  export function handleSystemCommandError(
    command: string,
    error: Error,
  ): void {
    const message = ERROR_MESSAGES.SYSTEM_COMMAND_FAILED;
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(
        `[Double-Click Image Opener] Command failed: ${command}`,
        error,
      );
    }
  }

  /**
   * Generic error handler for unexpected errors
   * @param error - The error object
   * @param context - Additional context about where the error occurred
   */
  export function handleGenericError(error: Error, context?: string): void {
    const message = 'An unexpected error occurred while opening the image';
    new Notice(message, 5000);
    if (settings?.enableDebugLogging) {
      console.error(
        `[Double-Click Image Opener] Unexpected error${context ? ` in ${context}` : ''}:`,
        error,
      );
    }
  }

  /**
   * Check if an error is a permission-related error
   * @param error - The error to check
   * @returns True if the error is permission-related
   */
  export function isPermissionError(error: Error): boolean {
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
  export function isFileNotFoundError(error: Error): boolean {
    const notFoundKeywords = ['ENOENT', 'file not found', 'no such file'];
    const errorMessage = error.message.toLowerCase();
    return notFoundKeywords.some((keyword) =>
      errorMessage.includes(keyword.toLowerCase()),
    );
  }
}
