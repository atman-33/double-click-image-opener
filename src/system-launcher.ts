import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Opens a file with the default system application
 * @param filePath - Absolute path to the file to open
 * @throws Error if the file cannot be opened
 */
export async function openWithDefaultApp(filePath: string): Promise<void> {
  const command = getOpenCommand();
  const escapedPath = escapeFilePath(filePath);

  await executeCommand(command, [escapedPath]);
}

/**
 * Gets the appropriate system command for opening files based on the current platform
 * @returns The command string for the current operating system
 */
function getOpenCommand(): string {
  const currentPlatform = platform();

  switch (currentPlatform) {
    case 'win32':
      return 'start';
    case 'darwin':
      return 'open';
    case 'linux':
      return 'xdg-open';
    default:
      // Fallback to xdg-open for other Unix-like systems
      return 'xdg-open';
  }
}

/**
 * Executes a system command with the given arguments
 * @param command - The command to execute
 * @param args - Array of arguments for the command
 * @throws Error if the command execution fails
 */
async function executeCommand(command: string, args: string[]): Promise<void> {
  try {
    const fullCommand = `${command} ${args.join(' ')}`;
    await execAsync(fullCommand);
  } catch (error) {
    throw new Error(
      `Failed to execute system command: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Escapes a file path to prevent command injection and handle special characters
 * @param filePath - The file path to escape
 * @returns The escaped file path safe for use in system commands
 */
function escapeFilePath(filePath: string): string {
  const currentPlatform = platform();

  if (currentPlatform === 'win32') {
    // On Windows, wrap path in double quotes to handle spaces and special characters
    return `"${filePath.replace(/"/g, '""')}"`;
  } else {
    // On Unix-like systems, escape special characters including parentheses
    return filePath.replace(/(["\s'$`\\()])/g, '\\$1');
  }
}
