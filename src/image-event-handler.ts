import type { App } from 'obsidian';
import { ErrorHandler } from './error-handler';
import type DoubleClickImageOpenerPlugin from './main';
import { PathResolver } from './path-resolver';
import { openWithDefaultApp } from './system-launcher';

/**
 * Handles image-related DOM events and coordinates image opening functionality
 */
export class ImageEventHandler {
  private pathResolver: PathResolver;
  private boundHandleDoubleClick: (event: MouseEvent) => Promise<void>;

  /**
   * Creates a new ImageEventHandler instance
   * @param app - The Obsidian App instance
   * @param plugin - The plugin instance
   */
  constructor(
    app: App,
    private plugin: DoubleClickImageOpenerPlugin,
  ) {
    this.pathResolver = new PathResolver(app);
    // Bind the event handler to maintain proper 'this' context
    this.boundHandleDoubleClick = this.handleImageDoubleClick.bind(this);
  }

  /**
   * Checks if the given element is an image element
   * @param element - The HTML element to check
   * @returns true if the element is an image element
   */
  public isImageElement(element: HTMLElement): boolean {
    // Check if it's directly an img element
    if (element.tagName.toLowerCase() === 'img') {
      return true;
    }

    // Check if it's a span with an image background (Obsidian's image rendering)
    if (
      element.tagName.toLowerCase() === 'span' &&
      element.classList.contains('image-embed')
    ) {
      return true;
    }

    // Check if it contains an img element as a child
    const imgChild = element.querySelector('img');
    return imgChild !== null;
  }

  /**
   * Extracts the image path from an image element
   * @param element - The image element to extract path from
   * @returns The image path or null if not found
   */
  public extractImagePath(element: HTMLImageElement): string | null {
    // Try multiple sources for the image path
    const possiblePaths = [
      element.src,
      element.alt,
      element.dataset.src,
      element.getAttribute('data-path'),
      element.getAttribute('data-href'),
      element.title,
    ].filter(Boolean);

    for (const path of possiblePaths) {
      if (path) {
        const sanitizedPath = this.sanitizeImagePath(path);
        if (sanitizedPath) {
          return sanitizedPath;
        }
      }
    }

    return null;
  }

  /**
   * Validates if the given path represents a supported image format
   * @param imagePath - The image path to validate
   * @returns True if the format is supported, false otherwise
   */
  private isValidImageFormat(imagePath: string): boolean {
    if (!imagePath || typeof imagePath !== 'string') {
      return false;
    }

    const supportedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '.bmp',
      '.svg',
      '.ico',
      '.tiff',
      '.tif',
      '.avif',
      '.heic',
      '.heif',
    ];

    // Handle paths with query parameters or fragments
    const cleanPath = imagePath.split('?')[0].split('#')[0];
    const lowercasePath = cleanPath.toLowerCase().trim();

    // Check if path has any extension
    if (!lowercasePath.includes('.')) {
      return false;
    }

    // Enhanced validation: check for multiple extensions (e.g., .tar.gz)
    // Only consider the last extension for image format validation
    const lastDotIndex = lowercasePath.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === lowercasePath.length - 1) {
      return false;
    }

    const extension = lowercasePath.substring(lastDotIndex);

    // Additional validation: ensure extension is reasonable length
    if (extension.length > 10) {
      return false;
    }

    return supportedExtensions.includes(extension);
  }

  /**
   * Sanitizes and normalizes an image path to handle special characters
   * @param imagePath - The raw image path
   * @returns Sanitized image path or null if invalid
   */
  private sanitizeImagePath(imagePath: string): string | null {
    if (!imagePath || typeof imagePath !== 'string') {
      return null;
    }

    try {
      // Remove any URL protocols and decode URI components
      let path = imagePath.trim();

      // Handle file:// URLs by extracting the path
      if (path.startsWith('file://')) {
        try {
          path = decodeURIComponent(path.replace('file://', ''));
        } catch (_decodeError) {
          // Handle malformed URI encoding
          path = path.replace('file://', '');
        }
      }

      // Handle app:// URLs (Obsidian's internal protocol)
      if (path.startsWith('app://')) {
        const match = path.match(/app:\/\/[^/]+\/(.+)/);
        if (match) {
          try {
            path = decodeURIComponent(match[1]);
          } catch (_decodeError) {
            // Handle malformed URI encoding
            path = match[1];
          }
        }
      }

      // Handle data URLs (base64 encoded images) - not supported for opening
      if (path.startsWith('data:')) {
        ErrorHandler.handleEmbeddedImageError(path);
        return null;
      }

      // Handle blob URLs - not supported for opening
      if (path.startsWith('blob:')) {
        ErrorHandler.handleEmbeddedImageError(path);
        return null;
      }

      // Handle http/https URLs - not supported for opening local files
      if (path.startsWith('http://') || path.startsWith('https://')) {
        ErrorHandler.handleNetworkImageError(path);
        return null;
      }

      // Remove query parameters and fragments
      path = path.split('?')[0].split('#')[0];

      // Enhanced handling of special characters and Unicode
      // Normalize Unicode characters (NFD to NFC)
      if (typeof path.normalize === 'function') {
        path = path.normalize('NFC');
      }

      // Normalize path separators and handle special characters
      path = path.replace(/\\/g, '/');

      // Handle encoded characters that might be in the path
      try {
        // Only decode if it looks like it contains encoded characters
        if (path.includes('%')) {
          const decodedPath = decodeURIComponent(path);
          // Verify the decoded path doesn't contain dangerous characters
          if (!this.isDangerousPath(decodedPath)) {
            path = decodedPath;
          }
        }
      } catch (_decodeError) {
        // If decoding fails, continue with the original path
        // This handles cases where % is used literally in filenames
      }

      // Remove any leading/trailing whitespace
      path = path.trim();

      // Additional validation for edge cases
      if (path.length === 0) {
        return null;
      }

      // Check for paths that are just dots or slashes
      if (/^[./\\]+$/.test(path)) {
        return null;
      }

      return path;
    } catch (error) {
      ErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'image path sanitization',
      );
      return null;
    }
  }

  /**
   * Handles double-click events on image elements
   * @param event - The mouse event
   */
  private async handleImageDoubleClick(event: MouseEvent): Promise<void> {
    try {
      const target = event.target as HTMLElement;

      // Check if the clicked element is an image or contains an image
      if (!this.isImageElement(target)) {
        return;
      }

      // Prevent default behavior and stop event propagation to avoid interference
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // Get the actual image element
      let imgElement: HTMLImageElement | null = null;

      if (target.tagName.toLowerCase() === 'img') {
        imgElement = target as HTMLImageElement;
      } else {
        // Look for img element within the target
        imgElement = target.querySelector('img');
      }

      if (!imgElement) {
        ErrorHandler.handleGenericError(
          new Error('Could not find image element'),
          'image element detection',
        );
        return;
      }

      // Extract the image path
      const imagePath = this.extractImagePath(imgElement);
      if (!imagePath) {
        ErrorHandler.handleGenericError(
          new Error('Could not extract image path from element'),
          'image path extraction',
        );
        return;
      }

      // Validate image format (comprehensive check)
      if (!this.isValidImageFormat(imagePath)) {
        ErrorHandler.handleInvalidImageFormat(imagePath);
        return;
      }

      // Additional validation for edge cases
      if (imagePath.length > 1000) {
        ErrorHandler.handleGenericError(
          new Error('Image path is too long'),
          'image path validation',
        );
        return;
      }

      // Check for potentially dangerous paths
      if (this.isDangerousPath(imagePath)) {
        ErrorHandler.handleGenericError(
          new Error('Image path contains potentially dangerous characters'),
          'image path security validation',
        );
        return;
      }

      // Resolve the image path to an absolute path using PathResolver
      const resolvedPath = this.pathResolver.resolveImagePath(imagePath);
      if (!resolvedPath) {
        // Error handling is already done in PathResolver
        return;
      }

      // Open the image with the default system application using SystemLauncher
      await openWithDefaultApp(resolvedPath);

      // Handle success with optional notification based on settings
      ErrorHandler.handleSuccess(resolvedPath);
    } catch (error) {
      // Handle any unexpected errors that weren't caught by specific handlers
      ErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'image double-click handling',
      );
    }
  }

  /**
   * Checks if a path contains potentially dangerous characters or patterns
   * @param imagePath - The image path to validate
   * @returns True if the path is potentially dangerous
   */
  private isDangerousPath(imagePath: string): boolean {
    // Check for null bytes (can be used for path traversal attacks)
    if (imagePath.includes('\0')) {
      return true;
    }

    // Check for excessive path traversal attempts
    const traversalCount = (imagePath.match(/\.\./g) || []).length;
    if (traversalCount > 5) {
      return true;
    }

    // Check for suspicious patterns that might indicate command injection
    // Be more selective - allow parentheses and brackets in filenames but not other dangerous chars
    const suspiciousPatterns = [
      /[;&|`$]/, // Command injection characters (excluding parentheses and brackets)
      /^\s*[<>]/, // Redirection operators
      /\$\{.*\}/, // Variable expansion
      /`.*`/, // Command substitution
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(imagePath));
  }

  /**
   * Updates the ErrorHandler with current plugin settings
   * Called when settings are changed to ensure proper error handling behavior
   */
  public updateSettings(): void {
    ErrorHandler.initialize(this.plugin.settings);
  }

  /**
   * Registers event listeners for image double-click handling
   */
  public registerEventListeners(): void {
    try {
      // Use event delegation on the document to catch all image double-clicks
      document.addEventListener('dblclick', this.boundHandleDoubleClick, true);
      console.log(
        '[Double-Click Image Opener] Event listeners registered successfully',
      );
    } catch (error) {
      ErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'event listener registration',
      );
    }
  }

  /**
   * Unregisters event listeners for proper cleanup
   */
  public unregisterEventListeners(): void {
    try {
      document.removeEventListener(
        'dblclick',
        this.boundHandleDoubleClick,
        true,
      );
      console.log(
        '[Double-Click Image Opener] Event listeners unregistered successfully',
      );
    } catch (error) {
      ErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'event listener cleanup',
      );
    }
  }
}
