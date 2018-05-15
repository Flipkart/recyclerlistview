set -e

echo "Deleting old packages..."
rm -rf node_modules
rm -rf dist

echo "Reinstalling packages..."
npm config set registry http://10.32.65.162:8080/
npm install