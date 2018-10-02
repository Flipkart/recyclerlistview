#!/usr/bin/env bash
set -e

echo "Deleting old packages..."
rm -rf node_modules
rm -rf dist

echo "Reinstalling packages..."
npm install