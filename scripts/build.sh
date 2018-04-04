#!/usr/bin/env bash
set -e

echo "Running TSLint..."
tslint 'src/**/*.{ts,tsx}'

echo "Build started..."
echo "Removing old builds..."
rm -rf dist

echo "Removing DEV mode code..."
echo "Isolating WEB code..."
cd src
file-directives WEB,RELEASE

echo "TSC: Building ES5 web package..."
cd ..
tsc --outDir dist/web

echo "Isolating REACT-NATIVE code..."
cd src
file-directives REACT-NATIVE,RELEASE

echo "TSC: Building ES5 react-native package..."
cd ..
tsc --outDir dist/reactnative

# echo "Removing unnecessary files..."
# rm -rf dist/reactnative/platform/web
# rm -rf dist/web/platform/reactnative

echo "Resetting code state..."
cd src
file-directives REACT-NATIVE,DEV
cd ..

echo "BUILD SUCCESS!"
