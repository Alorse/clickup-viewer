import * as vscode from 'vscode';
import * as constants from './constants';
import { LocalStorageService } from './lib/localStorageService';
import TokenManager from './lib/tokenManager';
import { ApiWrapper } from './lib/apiWrapper';
import { User } from './types';

let storageManager: LocalStorageService;
let tokenManager: TokenManager;
let apiWrapper: ApiWrapper;
let token: string | undefined;
let me: User;

export async function activate(context: vscode.ExtensionContext) {

	storageManager = new LocalStorageService(context.workspaceState);
	tokenManager = new TokenManager(storageManager);
	token = await tokenManager.init();

	if (token) {
		//If token exists fetch data
		apiWrapper = new ApiWrapper(token);
		me = await apiWrapper.getUser();
	}


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	vscode.commands.registerCommand('clickup.helloWorld', () => {
		vscode.window.showInformationMessage(`${constants.SET_TOKEN} ${me.username}`);
	});

	vscode.commands.registerCommand('clickup.setToken', async () => {
		if (await tokenManager.askToken()) {
			const token = await tokenManager.getToken();
			apiWrapper = new ApiWrapper(token);
			try {
				me = await apiWrapper.getUser();
				vscode.window.showInformationMessage(`${constants.SET_TOKEN} ${me.username}`);
			} catch (error) {
				vscode.window.showErrorMessage(constants.INVALID_TOKEN);
				console.log((<Error>error).message);
			}
		}
	});

	vscode.commands.registerCommand('clickup.getToken', async () => {
		const token = await tokenManager.getToken();
		if (!token) {
			vscode.window.showInformationMessage(constants.TOKEN_NOT_FOUND);
		} else {
			vscode.window.showInformationMessage(`${constants.YOUR_TOKEN} ${token}`);
		}
	});
}

export function deactivate() {}
