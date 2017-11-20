#!/usr/bin/env bash
set -e

read -p "You're pushing out a public build. Continue (y/n)?" CONT
if [ "$CONT" = "y" ]; then

npm run clean
npm run build

echo "Pushing out LATEST build..."
npm publish

echo "PUSH SUCCESS"
fi