"use strict";

import { UsagesProvider } from './usages-provider';
import {
  workspace,
  ExtensionContext,
  window,
  commands,
  Uri
} from "vscode";
import {
  Message,
  ErrorAction,
  CloseAction,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ExecuteCommandRequest
} from "vscode-languageclient/browser";
import { COMMANDS as ELS_COMMANDS } from './constants';

export async function activate(context: ExtensionContext) {

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: ["handlebars", "javascript", "typescript"],
    outputChannelName: "Unstable Ember Language Server",
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    synchronize: {},
    initializationOptions: { editor: 'vscode' },
    errorHandler: {
      error(error: Error, message: Message | undefined, count: number): ErrorAction {
        window.showErrorMessage(`${error.toString()} | ${message?.toString()} | ${count}`);
        return ErrorAction.Shutdown;
      },
      closed() {
        return CloseAction.DoNotRestart;
      }
    }
  };

  context.subscriptions.push(
    commands.registerCommand('els.fs.readFile', async (filePath: Uri) => {

      try {
        const data = await workspace.fs.readFile(filePath);
        return data.toString();
      } catch(e) {
        return null;
      }

    })
  )

  context.subscriptions.push(
    commands.registerCommand('els.fs.stat', async (filePath: Uri) => {
      try {
        const data = await workspace.fs.stat(filePath);
        return data;
      } catch(e) {
        return null;
      }
    })
  )

  context.subscriptions.push(
    commands.registerCommand('els.fs.readDirectory', async (filePath: Uri) => {
      try {
        const data = await workspace.fs.readDirectory(filePath);
        return data;
      } catch(e) {
        return null;
      }
    })
  )



  // Create the language client and start the client.
  let disposable = createWorkerLanguageClient(context, clientOptions);

  const fileUsagesProvider = new UsagesProvider();

  disposable.onReady().then(() => {
    disposable.onRequest(ExecuteCommandRequest.type.method, async ({command, arguments: args}) => {
      return commands.executeCommand(command, ...args);
    });
    commands.executeCommand(ELS_COMMANDS.SET_CONFIG, {local: {
      collectTemplateTokens: false,
      useBuiltinLinting: false
    }});

    window.onDidChangeActiveTextEditor(()=>{
      if (window.activeTextEditor) {
        fileUsagesProvider.refresh();
      }
    });

    let treeView = window.createTreeView('els.fileUsages', {
      treeDataProvider: fileUsagesProvider
    });
    fileUsagesProvider.setView(treeView);

  });
  context.subscriptions.push(disposable.start());

}

function createWorkerLanguageClient(context: ExtensionContext, clientOptions: LanguageClientOptions) {
	// Create a worker. The worker main file implements the language server.
	const serverMain = Uri.joinPath(context.extensionUri, 'node_modules/@lifeart/ember-language-server/dist/bundled/start-worker-server.js');
  const worker = new Worker(serverMain.toString(), {
    name: '@lifeart/ember-language-server',
    type: 'classic'
  });
	// create the language server client to communicate with the server running in the worker
	return new LanguageClient('emberLanguageServer', "Unstable Ember Language Server", clientOptions, worker);
}
