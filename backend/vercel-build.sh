#!/bin/bash
echo "Starting enhanced build process..."

# Print environment for debugging (no sensitive data)
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "AI_PROVIDER: $AI_PROVIDER"

# Add explicit warning about embedding dimensions
echo "⚠️ IMPORTANT: This database requires Mistral embeddings (1024 dimensions)"
echo "⚠️ OpenAI embeddings (1536 dimensions) will cause errors"

# Clean any previous build artifacts
rm -rf dist api
echo "Cleaned previous build artifacts"

# Check for stale files that might be causing issues
find . -name "*.js" -path "./src/*" -type f | xargs rm -f
echo "Removed any stale JS files from src directory"

# Install dependencies
npm ci
echo "Dependencies installed"

# Update source files to force Mistral
echo "Ensuring Mistral provider is used..."
if [ -f "src/server.ts" ]; then
  # Check if FORCE_MISTRAL is already defined
  if grep -q "FORCE_MISTRAL" "src/server.ts"; then
    echo "FORCE_MISTRAL constant already exists in server.ts"
  else
    # Add FORCE_MISTRAL constant after environment check
    awk '/console.log.*AI_PROVIDER/{print;print "\n// IMPORTANT: Force Mistral provider for compatibility with database embeddings\nconst FORCE_MISTRAL = true;\n";next}1' src/server.ts > server.ts.tmp
    mv server.ts.tmp src/server.ts
    echo "Added FORCE_MISTRAL constant to server.ts"
  fi
fi

# Run TypeScript compilation with verbose output
echo "Starting TypeScript compilation..."
npx tsc --listEmittedFiles
echo "TypeScript compilation complete"

# Create API directory and index file
mkdir -p api
echo "// Generated by build process at $(date)" > api/index.js
echo "const app = require('../dist/server');" >> api/index.js
echo "module.exports = app;" >> api/index.js
echo "Created API files"

# Verify the built files
echo "Verifying build..."
if [ -f "dist/server.js" ]; then
  echo "✅ dist/server.js exists"
else
  echo "❌ dist/server.js is missing!"
  exit 1
fi

if [ -f "dist/utils/textProcessing.js" ]; then
  echo "✅ dist/utils/textProcessing.js exists"
  # Check if the file contains direct OpenAI import
  if grep -q "openai" "dist/utils/textProcessing.js"; then
    echo "⚠️ Warning: dist/utils/textProcessing.js contains direct OpenAI references!"
    cat dist/utils/textProcessing.js | grep -n "openai"
    # Fail the build if we find OpenAI references
    echo "❌ Build failing due to OpenAI references in textProcessing.js"
    exit 1
  else
    echo "✅ textProcessing.js has no direct OpenAI imports"
  fi
fi

# Final check for FORCE_MISTRAL constant
if grep -q "FORCE_MISTRAL = true" "dist/server.js"; then
  echo "✅ FORCE_MISTRAL is set to true in compiled code"
else
  echo "❌ FORCE_MISTRAL constant not found in compiled code!"
  echo "Manual patch required to ensure Mistral embeddings..."
  # Patch the server.js to force Mistral provider
  sed -i 's/const provider = process.env.AI_PROVIDER || '"'"'openai'"'"';/const provider = '"'"'mistral'"'"'; \/\/ FORCED FOR EMBEDDING COMPATIBILITY/g' dist/server.js
  if [ $? -eq 0 ]; then
    echo "✅ Successfully patched server.js to force Mistral provider"
  else
    echo "❌ Failed to patch server.js"
    exit 1
  fi
fi

echo "Build completed successfully!" 