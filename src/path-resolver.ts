import { existsSync } from 'fs';
import type { App } from 'obsidian';
import { join, normalize, resolve } from 'path';

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
      return null;
    }

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
      return null;
    }

    return resolvedPath;
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
   */
  private resolveRelativePath(path: string): string {
    // Get the vault's base path from configDir (remove .obsidian suffix)
    const vaultBasePath = this.app.vault.configDir.replace(
      /[/\\]\.obsidian$/,
      '',
    );

    // Clean up the path - remove leading ./ and normalize
    const cleanPath = path.replace(/^\.\//, '');

    // Join with vault base path and resolve to absolute path
    const absolutePath = resolve(join(vaultBasePath, cleanPath));

    return normalize(absolutePath);
  }

  /**
   * Validates that a file exists at the given path
   * @param path - The absolute file path to validate
   * @returns True if file exists, false otherwise
   */
  private validateFileExists(path: string): boolean {
    try {
      return existsSync(path);
    } catch (_error) {
      // Handle permission errors or other filesystem errors
      return false;
    }
  }
}
