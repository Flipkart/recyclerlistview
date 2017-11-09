#!/usr/bin/env bash
set -e

read -p "You're pushing out a BETA public build. Continue (y/n)?" CONT
if [ "$CONT" = "y" ]; then

npm run clean
npm run build

echo "Pushing out BETA build..."
npm publish --tag beta

echo "PUSH SUCCESS"
fi