import { window, workspace, ExtensionContext, commands, Uri } from 'vscode';
import { promisify } from 'util';
import { readdir } from 'fs';
//@ts-ignore
import * as degit from 'degit';

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand(
    'extension.createProjectFromTemplate',
    createTemplate,
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

async function createTemplate() {
  const config = workspace.getConfiguration('degit-templates');
  const templates = <Array<string>>config.get('templates');
  let template = await window.showQuickPick(
    [...templates, 'Use Another Template'],
    {
      placeHolder: 'Wich template do you want to use ?',
    },
  );
  if (!template) return window.showWarningMessage('Aborted !');
  if (template === 'Use Another Template') {
    template = await window.showInputBox({
      placeHolder: 'Format: User/Repo',
      validateInput: (text) =>
        /\w+\/\w+/.test(text) ? null : 'Invalid Format',
    });
    if (!template) return window.showWarningMessage('Aborted !');
  }
  const folder: Uri[] | undefined = await window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
  });
  if (!folder) return window.showWarningMessage('Aborted !');
  const path = folder[0].fsPath;
  const uri = folder[0];
  const filesInDir = await promisify(readdir)(path);
  if (filesInDir.length)
    return window.showErrorMessage('Aborted : Directory Not Empty !');
  const d = degit(template, {
    cache: false,
    force: false,
    verbose: false,
  });
  try {
    await d.clone(path);
  } catch (err) {
    window.showErrorMessage(`Aborted : ${err} !`);
  }
  await commands.executeCommand('vscode.openFolder', uri);
  window.showInformationMessage('Done !');
}
