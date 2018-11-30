#!/usr/bin/env bash
set -e

#TARGET=$"/Users/ananya.chandra/Documents/ReactNativeRepos/ts-rex/node_modules/recyclerlistview/dist" #target-path
TARGET=$"/Users/ananya.chandra/Documents/ReactNativeRepos/ugc-react-native/node_modules/recyclerlistview/dist" #target-path

npm run build

echo "copying build..."
echo "copying to $TARGET.."
rm -rf "$TARGET"
cp -r dist "$TARGET"

echo "copy complete."