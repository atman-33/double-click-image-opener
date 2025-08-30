import type { App, Plugin } from 'obsidian';
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
   * Handles double-click events on image elements
   * @param event - The mouse event
   */
  private async handleImageDoubleClick(event: MouseEvent): Promise<void> {
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
      console.warn('Double-Click Image Opener: Could not find image element');
      return;
    }

    // Extract the image path
    const imagePath = this.extractImagePath(imgElement);
    if (!imagePath) {
      console.warn(
        'Double-Click Image Opener: Could not extract image path from element',
      );
      return;
    }

    try {
      // Resolve the image path to an absolute path using PathResolver
      const resolvedPath = this.pathResolver.resolveImagePath(imagePath);
      if (!resolvedPath) {
        console.error(
          'Double-Click Image Opener: Could not resolve image path:',
          imagePath,
        );
        // TODO: Show user-friendly error message in future error handling task
        return;
      }

      // Open the image with the default system application using SystemLauncher
      await openWithDefaultApp(resolvedPath);

      // TODO: Show success notification if enabled in settings (future task)
    } catch (error) {
      console.error('Double-Click Image Opener: Failed to open image:', error);
      // TODO: Handle specific error types in future error handling task
    }
  }

  /**
   * Registers event listeners for image double-click handling
   */
  public registerEventListeners(): void {
    // Use event delegation on the document to catch all image double-clicks
    document.addEventListener('dblclick', this.boundHandleDoubleClick, true);
  }

  /**
   * Unregisters event listeners for proper cleanup
   */
  public unregisterEventListeners(): void {
    document.removeEventListener('dblclick', this.boundHandleDoubleClick, true);
  }
}
