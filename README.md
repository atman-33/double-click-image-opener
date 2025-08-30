# Double-Click Image Opener

A lightweight Obsidian plugin that enhances image interaction by enabling users to open images in their default system application through double-click events.

## Features

- **Double-click to open**: Simply double-click any image in your Obsidian vault to open it in your default system image viewer
- **Cross-platform support**: Works on Windows, macOS, and Linux
- **Multiple view modes**: Compatible with Reading mode, Live Preview mode, and Source mode
- **Wide format support**: Supports all common image formats (PNG, JPG, JPEG, GIF, WebP, BMP, SVG, ICO, TIFF, AVIF, HEIC, etc.)
- **Smart path resolution**: Handles both wikilink syntax (`![[image.png]]`) and standard markdown syntax (`![](image.png)`)
- **Robust error handling**: Provides clear feedback for various error conditions
- **Configurable notifications**: Optional success notifications when images are opened
- **Security focused**: Validates file paths and prevents potential security issues

## How to Use

1. **Install the plugin**: Download and enable the plugin in your Obsidian settings
2. **Double-click any image**: In any view mode (Reading, Live Preview, or Source), simply double-click on an image
3. **Image opens externally**: The image will open in your system's default image viewer application
4. **Configure settings**: Optionally enable success notifications in the plugin settings

### Supported Image Formats

The plugin supports all image formats that Obsidian can display:
- PNG, JPG, JPEG
- GIF, WebP
- BMP, SVG, ICO
- TIFF, TIF
- AVIF, HEIC, HEIF

### View Mode Compatibility

- **Reading Mode**: Full support for all image types
- **Live Preview Mode**: Full support with dynamic content handling
- **Source Mode**: Works with preview overlays and embedded images

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Double-Click Image Opener"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/obsidianmd/obsidian-sample-plugin/releases)
2. Extract the files to your vault's `.obsidian/plugins/double-click-image-opener/` folder
3. Reload Obsidian and enable the plugin in settings

## Settings

The plugin provides the following configurable options:

- **Show success notifications**: Display a notification when an image is successfully opened (disabled by default)

Access settings through: Settings → Community Plugins → Double-Click Image Opener → Settings

## Technical Details

### Architecture

The plugin uses a modular architecture with the following components:

- **ImageEventHandler**: Manages DOM event listeners and image detection
- **PathResolver**: Resolves relative image paths to absolute file paths
- **SystemLauncher**: Handles cross-platform system application launching
- **ErrorHandler**: Provides comprehensive error handling and user feedback

### Security Features

- Path validation to prevent directory traversal attacks
- Command injection prevention through proper path escaping
- File type validation to ensure only image files are processed
- Comprehensive error handling for edge cases

### Performance Optimizations

- Event delegation to minimize memory footprint
- Lazy path resolution to avoid unnecessary file system operations
- Non-blocking operations to maintain UI responsiveness

## Development

### Prerequisites

- Node.js v16 or higher
- npm or yarn package manager

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd double-click-image-opener

# Install dependencies
npm install

# Start development mode with hot reload
npm run dev

# Build for production
npm run build
```

### Development Scripts

- `npm run dev` - Start development mode with watch compilation
- `npm run build` - Build for production
- `npm run lint` - Run code linting
- `npm run format` - Format code with Biome
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode

## Troubleshooting

### Common Issues

**Images don't open when double-clicked**
- Ensure the plugin is enabled in Obsidian settings
- Check that the image file exists in your vault
- Verify you have a default application set for the image format

**Permission denied errors**
- Check file permissions for the image
- Ensure your default image viewer has necessary permissions
- Try opening the image manually to verify it works

**Path resolution errors**
- Ensure image paths don't contain special characters that might cause issues
- Check that relative paths are correct relative to your vault root

### Debug Mode

Enable debug logging in the plugin settings to get detailed information about what's happening when you double-click images. Check the developer console (Ctrl+Shift+I) for debug messages.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this plugin helpful, consider supporting its development through the funding options in the plugin settings or repository.
