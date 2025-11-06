import { type App, PluginSettingTab, Setting } from 'obsidian';
import type DoubleClickImageOpenerPlugin from '../main';

/**
 * Settings tab for the Double-Click Image Opener plugin
 * Provides user interface for configuring plugin behavior
 */
export class DoubleClickImageOpenerSettingTab extends PluginSettingTab {
  plugin: DoubleClickImageOpenerPlugin;

  constructor(app: App, plugin: DoubleClickImageOpenerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Display the settings tab content
   */
  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Plugin title and description
    new Setting(containerEl)
      .setName('Double-click image opener settings')
      .setHeading()
      .setDesc(
        'Configure how the plugin behaves when opening images with double-click.',
      );

    // Success notifications setting
    new Setting(containerEl)
      .setName('Show success notifications')
      .setDesc(
        'Display a notification when an image is successfully opened in the default application',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showSuccessNotifications)
          .onChange(async (value) => {
            this.plugin.settings.showSuccessNotifications = value;
            await this.plugin.saveSettings();
          }),
      );

    // Debug logging setting - commented out for now
    // new Setting(containerEl)
    //   .setName('Enable debug logging')
    //   .setDesc(
    //     'Enable detailed logging for troubleshooting. Check the developer console for debug messages.',
    //   )
    //   .addToggle((toggle) =>
    //     toggle
    //       .setValue(this.plugin.settings.enableDebugLogging)
    //       .onChange(async (value) => {
    //         this.plugin.settings.enableDebugLogging = value;
    //         await this.plugin.saveSettings();
    //       }),
    //   );
  }
}
