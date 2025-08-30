import { Plugin } from 'obsidian';
import { ErrorHandler } from './error-handler';
import { ImageEventHandler } from './image-event-handler';
import { DoubleClickImageOpenerSettingTab } from './settings-tab';

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
  private eventHandler: ImageEventHandler;

  /**
   * Plugin initialization - called when plugin is loaded
   */
  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize error handler with settings
    ErrorHandler.initialize(this.settings);

    // Initialize the image event handler
    this.eventHandler = new ImageEventHandler(this.app, this);

    // Register event listeners for image double-click handling
    this.eventHandler.registerEventListeners();

    // Add settings tab
    this.addSettingTab(new DoubleClickImageOpenerSettingTab(this.app, this));

    console.log('Double-Click Image Opener plugin loaded');
  }

  /**
   * Plugin cleanup - called when plugin is unloaded
   */
  onunload(): void {
    // Clean up event listeners to prevent memory leaks
    if (this.eventHandler) {
      this.eventHandler.unregisterEventListeners();
    }

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

    // Update ErrorHandler with new settings
    ErrorHandler.initialize(this.settings);

    // Update event handler with new settings if it exists
    if (this.eventHandler) {
      this.eventHandler.updateSettings();
    }
  }
}
