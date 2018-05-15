#!/usr/bin/env bash
set -e

read -p "You're pushing out a BETA public build. Continue (y/n)?" CONT
if [ "$CONT" = "y" ]; then

npm run clean
npm run build

echo "Pushing out BETA build..."
npm config set registry http://10.85.59.116/artifactory/v1.0/artifacts/npm/
npm publish --tag beta

echo "PUSH SUCCESS"
fi