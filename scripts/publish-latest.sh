#!/usr/bin/env bash
read -p "You're pushing out a public build. Continue (y/n)?" CONT
if [ "$CONT" = "y" ]; then
rm -rf node_modules &&
npm install &&
npm run build &&
npm publish
fi