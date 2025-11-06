/** biome-ignore-all lint/style/useNodejsImportProtocol: <node: is unnecessary> */
import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';
import * as ErrorHandler from './error-handler';

const execAsync = promisify(exec);

/**
 * Opens a file with the default system application
 * @param filePath - Absolute path to the file to open
 * @throws Error if the file cannot be opened
 */
export async function openWithDefaultApp(filePath: string): Promise<void> {
  try {
    const command = getOpenCommand();
    const escapedPath = escapeFilePath(filePath);

    await executeCommand(command, [escapedPath]);
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific error types
      if (ErrorHandler.isPermissionError(error)) {
        ErrorHandler.handlePermissionError(error, filePath);
      } else if (ErrorHandler.isFileNotFoundError(error)) {
        ErrorHandler.handleFileNotFound(filePath);
      } else {
        ErrorHandler.handleSystemError(error, filePath);
      }
    } else {
      ErrorHandler.handleSystemError(new Error(String(error)), filePath);
    }
    throw error; // Re-throw to allow caller to handle if needed
  }
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
  let fullCommand: string;

  // Handle Windows start command specially to prevent opening command prompt
  if (command === 'start' && platform() === 'win32') {
    // Use empty string as window title to prevent path being interpreted as title
    fullCommand = `start "" ${args.join(' ')}`;
  } else {
    fullCommand = `${command} ${args.join(' ')}`;
  }

  try {
    await execAsync(fullCommand);
  } catch (error) {
    const commandError = new Error(
      `Failed to execute system command: ${error instanceof Error ? error.message : String(error)}`,
    );

    // Log the command failure for debugging
    ErrorHandler.handleSystemCommandError(
      fullCommand,
      error instanceof Error ? error : new Error(String(error)),
    );

    throw commandError;
  }
}

/**
 * Validates that a file path is safe to use in system commands
 * @param filePath - The file path to validate
 * @returns True if the path is safe, false otherwise
 */
function isValidFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Check for null bytes
  if (filePath.includes('\0')) {
    return false;
  }

  // Check for excessively long paths
  if (filePath.length > 2000) {
    return false;
  }

  // Check for suspicious command injection patterns
  const dangerousPatterns = [
    /[;&|`$(){}[\]]/, // Command injection characters
    /^\s*[<>]/, // Redirection operators
    /\$\{.*\}/, // Variable expansion
    /`.*`/, // Command substitution
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Escapes a file path to prevent command injection and handle special characters
 * @param filePath - The file path to escape
 * @returns The escaped file path safe for use in system commands
 */
function escapeFilePath(filePath: string): string {
  // First validate the path
  if (!isValidFilePath(filePath)) {
    throw new Error(
      'File path contains invalid or potentially dangerous characters',
    );
  }

  const currentPlatform = platform();

  if (currentPlatform === 'win32') {
    // On Windows, wrap path in double quotes to handle spaces and special characters
    // Escape any existing double quotes by doubling them
    return `"${filePath.replace(/"/g, '""')}"`;
  } else {
    // On Unix-like systems, escape special characters
    // More comprehensive escaping for special characters
    return filePath.replace(/(["\s'\\()[\]{}*?~`!&;<>|$])/g, '\\$1');
  }
}
