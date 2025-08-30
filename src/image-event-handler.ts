import type { App, Plugin } from 'obsidian';
import { ErrorHandler } from './error-handler';
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
    private app: App,
    private plugin: Plugin,
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
    // Try to get the src attribute first
    if (element.src) {
      // Remove any URL protocols and decode URI components
      let path = element.src;

      // Handle file:// URLs by extracting the path
      if (path.startsWith('file://')) {
        path = decodeURIComponent(path.replace('file://', ''));
      }

      // Handle app:// URLs (Obsidian's internal protocol)
      if (path.startsWith('app://')) {
        // Extract the path after the protocol and vault identifier
        const match = path.match(/app:\/\/[^/]+\/(.+)/);
        if (match) {
          path = decodeURIComponent(match[1]);
        }
      }

      return path;
    }

    // Try to get from alt attribute (sometimes contains the original path)
    if (element.alt) {
      return element.alt;
    }

    // Try to get from data attributes that Obsidian might use
    if (element.dataset.src) {
      return element.dataset.src;
    }

    return null;
  }

  /**
   * Validates if the given path represents a supported image format
   * @param imagePath - The image path to validate
   * @returns True if the format is supported, false otherwise
   */
  private isValidImageFormat(imagePath: string): boolean {
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
    ];

    const lowercasePath = imagePath.toLowerCase();
    return supportedExtensions.some((ext) => lowercasePath.endsWith(ext));
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

      // Validate image format (basic check)
      if (!this.isValidImageFormat(imagePath)) {
        ErrorHandler.handleInvalidImageFormat(imagePath);
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

      // Success - no notification needed as the image should open
      console.log(
        `[Double-Click Image Opener] Successfully opened: ${resolvedPath}`,
      );
    } catch (error) {
      // Handle any unexpected errors that weren't caught by specific handlers
      ErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'image double-click handling',
      );
    }
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
