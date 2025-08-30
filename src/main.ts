import { Plugin } from 'obsidian';

/**
 * Interface representing the context of an image element being processed
 */
interface ImageContext {
  element: HTMLImageElement;
  originalPath: string;
  resolvedPath: string | null;
  fileExists: boolean;
}

/**
 * Interface for plugin configuration settings
 */
interface PluginSettings {
  showSuccessNotifications: boolean;
  enableDebugLogging: boolean;
}

/**
 * Default plugin settings
 */
const DEFAULT_SETTINGS: PluginSettings = {
  showSuccessNotifications: false,
  enableDebugLogging: false,
};

/**
 * Main plugin class for Double-Click Image Opener
 * Handles the core plugin lifecycle and coordinates image opening functionality
 */
export default class DoubleClickImageOpenerPlugin extends Plugin {
  settings: PluginSettings;

  /**
   * Plugin initialization - called when plugin is loaded
   */
  async onload(): Promise<void> {
    await this.loadSettings();

    // TODO: Initialize event handlers and other components in future tasks
    console.log('Double-Click Image Opener plugin loaded');
  }

  /**
   * Plugin cleanup - called when plugin is unloaded
   */
  onunload(): void {
    // TODO: Clean up event listeners and other resources in future tasks
    console.log('Double-Click Image Opener plugin unloaded');
  }

  /**
   * Load plugin settings from storage
   */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Save plugin settings to storage
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
