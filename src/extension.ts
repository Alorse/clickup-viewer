import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import * as translations from '../l10n/bundle.l10n.json';
import { LocalStorageService } from './lib/localStorageService';
import { TaskListProvider } from './treeItems/taskListProvider';
import TokenManager from './lib/tokenManager';
import { ApiWrapper } from './lib/apiWrapper';
import { User, Team, Task } from './types';
import { OpenTaskPanel } from './panelItems/openTaskPanel';

let storageManager: LocalStorageService;
let tokenManager: TokenManager;
let apiWrapper: ApiWrapper;
let taskListProvider: TaskListProvider;
let token: string | undefined;
let me: User;
let teams: Team[];

export async function activate(context: vscode.ExtensionContext) {

	l10n.config({
		contents: translations,
	});
	
	storageManager = new LocalStorageService(context.workspaceState);
	tokenManager = new TokenManager(storageManager, l10n);
	token = await tokenManager.init();

	if (token) {
		//If token exists fetch data
		apiWrapper = new ApiWrapper(token);
		me = await apiWrapper.getUser();

		teams = await apiWrapper.getTeams();
		taskListProvider = new TaskListProvider(teams, apiWrapper, storageManager);

		startTreeViews();
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	vscode.commands.registerCommand('clickup.helloWorld', () => {
		vscode.window.showInformationMessage(`${l10n.t('SET_TOKEN')} ${me.username}`);
	});

	vscode.commands.registerCommand('clickup.setToken', async () => {
		if (await tokenManager.askToken()) {
			const token = await tokenManager.getToken();
			apiWrapper = new ApiWrapper(token);
			try {
				me = await apiWrapper.getUser();
				vscode.window.showInformationMessage(`${l10n.t('SET_TOKEN')} ${me.username}`);
			} catch (error) {
				vscode.window.showErrorMessage(l10n.t("INVALID_TOKEN"));
				console.log((<Error>error).message);
			}
		}
	});

	vscode.commands.registerCommand('clickup.getToken', async () => {
		const token = await tokenManager.getToken();
		if (!token) {
			vscode.window.showInformationMessage(l10n.t("TOKEN_NOT_FOUND"));
		} else {
			vscode.window.showInformationMessage(l10n.t("YOUR_TOKEN {0}", token));
		}
	});

	vscode.commands.registerCommand('clickup.openTask', async (task: Task) => {
		new OpenTaskPanel(task);
	});
	
}

function startTreeViews() {
	vscode.window.createTreeView('tasksViewer', {
		treeDataProvider: taskListProvider,
		showCollapseAll: true,
	});
	setTimeout(() => {
		console.log("Refreshing task list...");
		taskListProvider.refresh();
	}, 1000);
}

export function deactivate() {}
