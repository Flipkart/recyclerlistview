#!/usr/bin/env bash
read -p "You pushing a public build. Continue (y/n)?" CONT
if [ "$CONT" = "y" ]; then
npm run build
npm publish
fi