# This script automates the release process for the Obsidian plugin.
# It reads the version from package.json, builds the plugin, creates a ZIP archive,
# and then creates a new release on GitHub with the archive.

# Ensure the script stops on any error.
$ErrorActionPreference = 'Stop'

# --- Configuration ---
Write-Host "Reading configuration from package.json..."

# Get the project root directory, regardless of where the script is run from
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

# Read package.json to get name and version
$packageJson = Get-Content -Path "./package.json" -Raw | ConvertFrom-Json
$version = $packageJson.version
$pluginName = $packageJson.name

if (-not $version -or -not $pluginName) {
    Write-Error "Could not read name or version from package.json"
    exit 1
}

Write-Host "Plugin: $pluginName"
Write-Host "Version: $version"

# Define the files to be included in the release and the name of the ZIP file.
$releaseFiles = @("main.js", "styles.css", "manifest.json")
$zipFileName = "$($pluginName)-v$($version).zip"
$releaseTag = "v$($version)"


# --- 1. Build Project ---
Write-Host "Building the project..."
npm run build


# --- 2. Create ZIP Archive ---
Write-Host "Creating ZIP archive: $($zipFileName)..."

# Check if all required files exist before creating the archive.
foreach ($file in $releaseFiles) {
    if (-not (Test-Path $file)) {
        Write-Error "Build artifact not found: $file. Aborting."
        exit 1
    }
}

# Remove the old ZIP file if it exists to prevent including it in the new archive.
if (Test-Path $zipFileName) {
    Remove-Item $zipFileName
}
Compress-Archive -Path $releaseFiles -DestinationPath $zipFileName -Force


# --- 3. Create GitHub Release ---
Write-Host "Authenticating with GitHub..."
gh auth login

Write-Host "Creating GitHub release for tag $($releaseTag)..."
# Note: This requires the GitHub CLI ('gh') to be installed and authenticated.
gh release create $releaseTag ./$zipFileName --title "Version $version" --notes "Release for version $version."

Write-Host " "
Write-Host "Release process completed successfully!"
Write-Host "Version $version of $pluginName has been released to GitHub."
