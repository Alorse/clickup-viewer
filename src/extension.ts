import * as vscode from 'vscode';
import * as constants from './constants';
import { LocalStorageService } from './lib/localStorageService';
import TokenManager from './lib/tokenManager';

let storageManager: LocalStorageService;
let tokenManager: TokenManager;
export function activate(context: vscode.ExtensionContext) {

	storageManager = new LocalStorageService(context.workspaceState);
	tokenManager = new TokenManager(storageManager);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	vscode.commands.registerCommand('clickup.helloWorld', () => {
		vscode.window.showInformationMessage(constants.NO_CLICKUP_TOKEN_SET);
	});

	vscode.commands.registerCommand('clickup.setToken', async () => {
		if (await tokenManager.askToken()) {
			vscode.window.showInformationMessage(constants.SET_TOKEN);
		}
	});

	vscode.commands.registerCommand('clickup.getToken', async () => {
		const token = await tokenManager.getToken();
		if (!token) {
			vscode.window.showInformationMessage(constants.TOKEN_NOT_FOUND);
		} else {
			vscode.window.showInformationMessage(`Your token is: ${token}`);
		}
	});
}

export function deactivate() {}
