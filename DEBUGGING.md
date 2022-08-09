# Debugging `vscode-ember` via VSCode

 - Run `yarn` to install dependencies
 - Run `yarn build:langserver` to build language server (ts errors ok)
 - Run debug process `Launch UELS Extension`


## Building development version of `Stable Ember Language Server`
 - Go to `ember-language-server` folder
 - Run `yarn link`
 - Go to `vscode-ember` folder
 - Run `yarn link @lifeart/ember-language-server`
 - Rebuild the language server (`yarn build:langserver`) after every change in the language server code
