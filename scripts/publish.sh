#!/bin/bash

echo "🚀 Publishing create-electron-react-app..."

# Build the project
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Run tests (if any)
# npm test

# Publish to npm
npm publish

echo "✅ Published successfully!"