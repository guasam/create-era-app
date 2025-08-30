#!/bin/bash

echo "🚀 Setting up template..."

# Create template directory
mkdir -p template

# Clone the main repository
git clone https://github.com/guasam/electron-react-app.git temp-repo

# Copy files to template (excluding unnecessary ones)
rsync -av --exclude='node_modules' \
          --exclude='dist' \
          --exclude='out' \
          --exclude='.git' \
          --exclude='.DS_Store' \
          --exclude='create-electron-react-app' \
          temp-repo/ template/

# Clean up
rm -rf temp-repo

echo "✅ Template setup complete!"