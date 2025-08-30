# This script automates the release process for the Obsidian plugin.
# It reads the version from manifest.json, builds the plugin,
# and then creates a new release on GitHub with the required files.

# Ensure the script stops on any error.
$ErrorActionPreference = 'Stop'

# --- Configuration ---
Write-Host "Reading configuration from manifest.json..."

# Get the project root directory, regardless of where the script is run from
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

# Read manifest.json to get name and version
$manifestJson = Get-Content -Path "./manifest.json" -Raw | ConvertFrom-Json
$version = $manifestJson.version
$pluginName = $manifestJson.name

if (-not $version -or -not $pluginName) {
    Write-Error "Could not read name or version from manifest.json"
    exit 1
}

Write-Host "Plugin: $pluginName"
Write-Host "Version: $version"

# Define the files to be included in the release
$releaseFiles = @("main.js", "manifest.json")
if (Test-Path "styles.css") {
    $releaseFiles += "styles.css"
}
$releaseTag = "v$($version)"


# --- 1. Build Project ---
Write-Host "Building the project..."
npm run build


# --- 2. Verify Files Exist ---
Write-Host "Checking required files..."
foreach ($file in $releaseFiles) {
    if (-not (Test-Path $file)) {
        Write-Error "Build artifact not found: $file. Aborting."
        exit 1
    }
}


# --- 3. Create GitHub Release ---
Write-Host "Authenticating with GitHub..."
try {
    gh auth status
} catch {
    Write-Host "Not authenticated. Logging in..."
    gh auth login
}

Write-Host "Creating GitHub release for tag $($releaseTag)..."
# Note: This requires the GitHub CLI ('gh') to be installed and authenticated.
gh release create $releaseTag $releaseFiles --title "Release $version" --notes "Release for version $version."

Write-Host " "
Write-Host "Release process completed successfully!"
Write-Host "Version $version of $pluginName has been released to GitHub."
