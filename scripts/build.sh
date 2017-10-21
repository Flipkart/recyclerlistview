#!/usr/bin/env bash
rm -rf dist
cd src
file-directives WEB,RELEASE
cd ..
babel src --out-dir dist/web
cd src
file-directives REACT-NATIVE,RELEASE
cd ..
babel src --out-dir dist/reactnative
cd src
file-directives REACT-NATIVE,DEV
cd ..
