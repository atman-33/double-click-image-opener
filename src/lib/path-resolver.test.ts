import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { join, normalize, resolve } from 'node:path';
import type { App } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathResolver } from './path-resolver';

// Mock Node.js fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Mock Obsidian App
const mockApp = {
  vault: {
    configDir: '/mock/vault/path/.obsidian',
  },
} as unknown as App;

describe('PathResolver', () => {
  let pathResolver: PathResolver;

  beforeEach(() => {
    pathResolver = new PathResolver(mockApp);
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('isAbsolutePath', () => {
    it('should detect Windows absolute paths', () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      expect(pathResolver.isAbsolutePath('C:\\Users\\test\\image.jpg')).toBe(
        true,
      );
      expect(pathResolver.isAbsolutePath('D:/Users/test/image.jpg')).toBe(true);
      expect(pathResolver.isAbsolutePath('\\\\server\\share\\image.jpg')).toBe(
        true,
      );
    });

    it('should detect Windows relative paths', () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      expect(pathResolver.isAbsolutePath('images\\test.jpg')).toBe(false);
      expect(pathResolver.isAbsolutePath('.\\images\\test.jpg')).toBe(false);
      expect(pathResolver.isAbsolutePath('..\\images\\test.jpg')).toBe(false);
    });

    it('should detect Unix absolute paths', () => {
      // Mock Unix platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      expect(pathResolver.isAbsolutePath('/home/user/image.jpg')).toBe(true);
      expect(pathResolver.isAbsolutePath('/var/www/images/test.png')).toBe(
        true,
      );
    });

    it('should detect Unix relative paths', () => {
      // Mock Unix platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      expect(pathResolver.isAbsolutePath('images/test.jpg')).toBe(false);
      expect(pathResolver.isAbsolutePath('./images/test.jpg')).toBe(false);
      expect(pathResolver.isAbsolutePath('../images/test.jpg')).toBe(false);
    });

    it('should handle macOS paths', () => {
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });

      expect(pathResolver.isAbsolutePath('/Users/test/image.jpg')).toBe(true);
      expect(pathResolver.isAbsolutePath('images/test.jpg')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Mock Windows platform for edge cases
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      expect(pathResolver.isAbsolutePath('')).toBe(false);
      expect(pathResolver.isAbsolutePath('C')).toBe(false);
      expect(pathResolver.isAbsolutePath('C:')).toBe(false);
    });
  });

  describe('resolveImagePath', () => {
    const mockExistsSync = vi.mocked(existsSync);

    it('should return null for empty or invalid paths', () => {
      expect(pathResolver.resolveImagePath('')).toBe(null);
      expect(pathResolver.resolveImagePath('   ')).toBe(null);
    });

    it('should handle absolute paths when file exists', () => {
      // Mock Unix platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      mockExistsSync.mockReturnValue(true);
      const absolutePath = '/home/user/image.jpg';
      // Use posix normalize for Unix paths to ensure consistent behavior
      const normalizedPath = path.posix.normalize(absolutePath);

      const result = pathResolver.resolveImagePath(absolutePath);
      expect(result).toBe(normalizedPath);
      expect(mockExistsSync).toHaveBeenCalledWith(normalizedPath);
    });

    it('should handle Windows absolute paths when file exists', () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      mockExistsSync.mockReturnValue(true);
      const absolutePath = 'C:\\Users\\test\\image.jpg';
      // Use win32 normalize for Windows paths to ensure consistent behavior across platforms
      const normalizedPath = path.win32.normalize(absolutePath);

      const result = pathResolver.resolveImagePath(absolutePath);
      expect(result).toBe(normalizedPath);
      expect(mockExistsSync).toHaveBeenCalledWith(normalizedPath);
    });

    it('should return null when absolute path file does not exist', () => {
      // Mock Unix platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      mockExistsSync.mockReturnValue(false);
      const absolutePath = '/home/user/nonexistent.jpg';
      // Use posix normalize for Unix paths to ensure consistent behavior
      const normalizedPath = path.posix.normalize(absolutePath);

      const result = pathResolver.resolveImagePath(absolutePath);
      expect(result).toBe(null);
      expect(mockExistsSync).toHaveBeenCalledWith(normalizedPath);
    });

    it('should handle relative paths when file exists', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = 'images/test.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle relative paths with ./ prefix', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = './images/test.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', 'images/test.jpg')),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should return null when relative path file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      const relativePath = 'images/nonexistent.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(null);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle filesystem errors gracefully', () => {
      // Mock existsSync to throw an error (e.g., permission denied)
      mockExistsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const relativePath = 'images/test.jpg';
      const result = pathResolver.resolveImagePath(relativePath);

      expect(result).toBe(null);
    });

    it('should handle images in subfolders', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = 'assets/images/subfolder/test.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle images with spaces in filenames', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = 'images/my image file.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle images with special characters in filenames', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = 'images/test-image_v2.0 (copy).jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle images with unicode characters in filenames', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = 'images/测试图片.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle deeply nested subfolder paths', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = 'assets/images/2024/january/screenshots/test.png';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });

    it('should handle parent directory references in relative paths', () => {
      mockExistsSync.mockReturnValue(true);
      const relativePath = '../shared-images/test.jpg';
      const expectedAbsolutePath = normalize(
        resolve(join('/mock/vault/path', relativePath)),
      );

      const result = pathResolver.resolveImagePath(relativePath);
      expect(result).toBe(expectedAbsolutePath);
      expect(mockExistsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    });
  });
});
