import { existsSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import type { App } from 'obsidian';
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
    if (!imagePath || imagePath.trim() === '') {
      ErrorHandler.handlePathResolutionError('Empty or invalid path provided');
      return null;
    }

    try {
      let resolvedPath: string;

      if (this.isAbsolutePath(imagePath)) {
        // Handle absolute paths - normalize and validate
        resolvedPath = normalize(imagePath);
      } else {
        // Handle relative paths - resolve using vault base path
        resolvedPath = this.resolveRelativePath(imagePath);
      }

      // Validate that the file exists
      if (!this.validateFileExists(resolvedPath)) {
        ErrorHandler.handleFileNotFound(resolvedPath);
        return null;
      }

      return resolvedPath;
    } catch (error) {
      ErrorHandler.handlePathResolutionError(imagePath);
      console.error(
        `[Double-Click Image Opener] Path resolution error for ${imagePath}:`,
        error,
      );
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
