#!/bin/bash
echo "Starting build process..."

# Clean any previous build artifacts
rm -rf dist api
echo "Cleaned previous build"

# Install dependencies
npm ci
echo "Dependencies installed"

# Run TypeScript compilation
npm run build
echo "TypeScript compilation complete"

# Display build information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Build completed successfully" 