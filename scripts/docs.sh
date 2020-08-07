echo "Updating docs"
typedoc --ignoreCompilerErrors --mode file --theme minimal && touch docs/.nojekyll
echo "DOCS UPDATED!"
