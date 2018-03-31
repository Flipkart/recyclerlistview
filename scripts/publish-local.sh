#!/usr/bin/env bash
set -e

npm run build

echo "copying build..."
rm -rf /Users/talha.naqvi/Documents/Work/rn-rnw-setup-live-reload/node_modules/recyclerlistview/dist
cp -r dist /Users/talha.naqvi/Documents/Work/rn-rnw-setup-live-reload/node_modules/recyclerlistview/dist
echo "copy complete."