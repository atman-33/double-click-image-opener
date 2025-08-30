import { existsSync } from 'fs';
import type { App } from 'obsidian';
import { join, normalize, resolve } from 'path';
import { ErrorHandler } from './error-handler';

/**
 * Service class for resolving image paths from relative to absolute paths
 * Handles cross-platform path resolution and file validation
 */
export class PathResolver {
  constructor(private app: App) {}

  /**
   * Resolves an image path to an absolute file system path
   * @param imagePath - The image path from the markdown (relative or absolute)
   * @returns Absolute file path or null if resolution fails
   */
  public resolveImagePath(imagePath: string): string | null {
    if (
      !imagePath ||
      typeof imagePath !== 'string' ||
      imagePath.trim() === ''
    ) {
      ErrorHandler.handlePathResolutionError('Empty or invalid path provided');
      return null;
    }

    // Check for excessively long paths
    if (imagePath.length > 1000) {
      ErrorHandler.handlePathResolutionError('Path is too long');
      return null;
    }

    // Check for null bytes or other dangerous characters
    if (imagePath.includes('\0')) {
      ErrorHandler.handlePathResolutionError('Path contains null bytes');
      return null;
    }

    try {
      // Clean and normalize the path with enhanced special character handling
      let cleanPath = imagePath.trim();

      // Handle Unicode normalization for special characters
      if (typeof cleanPath.normalize === 'function') {
        cleanPath = cleanPath.normalize('NFC');
      }

      // Normalize path separators
      cleanPath = cleanPath.replace(/\\/g, '/');

      // Handle multiple consecutive slashes
      cleanPath = cleanPath.replace(/\/+/g, '/');

      // Remove trailing slashes (except for root)
      if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
      }

      let resolvedPath: string;

      if (this.isAbsolutePath(cleanPath)) {
        // Handle absolute paths - normalize and validate
        resolvedPath = normalize(cleanPath);
      } else {
        // Handle relative paths - resolve using vault base path
        resolvedPath = this.resolveRelativePath(cleanPath);
      }

      // Additional security check - ensure resolved path is reasonable
      if (resolvedPath.length > 2000) {
        ErrorHandler.handlePathResolutionError('Resolved path is too long');
        return null;
      }

      // Enhanced validation for special characters in resolved path
      if (!this.isValidResolvedPath(resolvedPath)) {
        ErrorHandler.handlePathResolutionError(
          'Resolved path contains invalid characters',
        );
        return null;
      }

      // Validate that the file exists
      if (!this.validateFileExists(resolvedPath)) {
        ErrorHandler.handleFileNotFound(resolvedPath);
        return null;
      }

      return resolvedPath;
    } catch (error) {
      ErrorHandler.handlePathResolutionError(imagePath);
      if (
        this.app.vault.adapter &&
        'enableDebugLogging' in this.app.vault.adapter
      ) {
        console.error(
          `[Double-Click Image Opener] Path resolution error for ${imagePath}:`,
          error,
        );
      }
      return null;
    }
  }

  /**
   * Checks if a path is absolute (cross-platform)
   * @param path - The path to check
   * @returns True if the path is absolute, false otherwise
   */
  public isAbsolutePath(path: string): boolean {
    // Handle Windows absolute paths (C:\, D:\, etc.)
    if (process.platform === 'win32') {
      return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith('\\\\');
    }

    // Handle Unix-like absolute paths (starting with /)
    return path.startsWith('/');
  }

  /**
   * Resolves a relative path using Obsidian's vault API
   * @param path - The relative path to resolve
   * @returns Absolute file path
   * @throws Error if vault base path cannot be determined
   */
  private resolveRelativePath(path: string): string {
    try {
      // Get the vault's base path from configDir (remove .obsidian suffix)
      const vaultBasePath = this.app.vault.configDir.replace(
        /[/\\]\.obsidian$/,
        '',
      );

      if (!vaultBasePath) {
        throw new Error('Could not determine vault base path');
      }

      // Clean up the path - remove leading ./ and normalize
      const cleanPath = path.replace(/^\.\//, '');

      // Join with vault base path and resolve to absolute path
      const absolutePath = resolve(join(vaultBasePath, cleanPath));

      return normalize(absolutePath);
    } catch (error) {
      throw new Error(
        `Failed to resolve relative path "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validates that a resolved path is safe and reasonable
   * @param path - The resolved path to validate
   * @returns True if the path is valid, false otherwise
   */
  private isValidResolvedPath(path: string): boolean {
    // Check for null bytes
    if (path.includes('\0')) {
      return false;
    }

    // Check for control characters (except tab, newline, carriage return)
    // Using a more explicit approach to avoid linter warnings
    for (let i = 0; i < path.length; i++) {
      const charCode = path.charCodeAt(i);
      // Check for control characters: 0-8, 11, 12, 14-31, 127
      if (
        (charCode >= 0 && charCode <= 8) ||
        charCode === 11 ||
        charCode === 12 ||
        (charCode >= 14 && charCode <= 31) ||
        charCode === 127
      ) {
        return false;
      }
    }

    // Check for excessive path traversal (more than reasonable for any vault structure)
    const traversalCount = (path.match(/\.\./g) || []).length;
    if (traversalCount > 10) {
      return false;
    }

    // Check for suspicious patterns that might indicate injection attempts
    // Be more selective - allow parentheses and brackets in filenames but not other dangerous chars
    const suspiciousPatterns = [
      /[;&|`$]/, // Command injection characters (excluding parentheses and brackets)
      /^\s*[<>]/, // Redirection operators at start
      /\$\{.*\}/, // Variable expansion
      /`.*`/, // Command substitution
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(path))) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a file exists at the given path
   * @param path - The absolute file path to validate
   * @returns True if file exists, false otherwise
   */
  private validateFileExists(path: string): boolean {
    try {
      return existsSync(path);
    } catch (error) {
      // Handle permission errors or other filesystem errors
      if (error instanceof Error && ErrorHandler.isPermissionError(error)) {
        ErrorHandler.handlePermissionError(error, path);
      }
      return false;
    }
  }
}
