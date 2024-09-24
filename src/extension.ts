import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import * as translations from '../l10n/bundle.l10n.json';
import { LocalStorageController } from './controllers/LocalStorageController';
import { TaskListProvider } from './treeItems/taskListProvider';
import { MyTaskListProvider } from './treeItems/myTaskListProvider';
import { TaskItemDecorationProvider } from './providers/TaskItemDecorationProvider';
import { TimeTrackerListProvider } from './treeItems/TimeTrackerListProvider';
import TokenManager from './lib/TokenManager';
import { ApiWrapper } from './lib/ApiWrapper';
import { User, Team, Task } from './types';
import { OpenTaskPanel } from './panelItems/openTaskPanel';
import { TaskController } from './controllers/TaskController';

let storageManager: LocalStorageController;
let tokenManager: TokenManager;
let apiWrapper: ApiWrapper;
let taskListProvider: TaskListProvider;
let myTaskListProvider: MyTaskListProvider;
let token: string | undefined;
let me: User;
let teams: Team[];
let taskController: TaskController;
let timeTrackerListProvider: TimeTrackerListProvider;
export async function activate(context: vscode.ExtensionContext) {

	l10n.config({
		contents: translations,
	});

	storageManager = new LocalStorageController(context.workspaceState);
	tokenManager = new TokenManager(storageManager, l10n);
	token = await tokenManager.init();

	if (token) {
		//If token exists fetch data
		apiWrapper = new ApiWrapper(token);
		me = await apiWrapper.getUser();
		
		teams = await apiWrapper.getTeams();
		taskListProvider = new TaskListProvider(teams, apiWrapper, storageManager);
		myTaskListProvider = new MyTaskListProvider(apiWrapper, teams, me.id, storageManager);
		timeTrackerListProvider = new TimeTrackerListProvider(apiWrapper);

		taskController = new TaskController(apiWrapper, storageManager, timeTrackerListProvider);
		taskController.initSelectedTask();

		registerDecorators(context);
		startTreeViews();
	}

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

	vscode.commands.registerCommand('clickup.refreshSpaces', () => {
		taskListProvider.refresh();
	});

	vscode.commands.registerCommand('clickup.refreshMyTasks', () => {
		myTaskListProvider.refresh();
	});

	vscode.commands.registerCommand('clickup.openInWeb', (taskItem) => {
		taskItem.task.url && vscode.env.openExternal(vscode.Uri.parse(taskItem.task.url));
	});

	vscode.commands.registerCommand('clickup.trackedTime', (taskItem) => {
		timeTrackerListProvider.task = taskItem.task;
    	timeTrackerListProvider.refresh(); 
	});

	vscode.commands.registerCommand('clickup.startTrackingTime', (taskItem) => {
		taskController.selectTasks(taskItem.command.arguments);
	});

	vscode.commands.registerCommand('clickup.startTimer', () => {
		taskController.startTimer();
	});
	vscode.commands.registerCommand('clickup.stopTimer', () => {
		taskController.stopTimer();
	});

}

function startTreeViews() {
	vscode.window.createTreeView('spacesViewer', {
		treeDataProvider: taskListProvider,
		showCollapseAll: true,
	});

	vscode.window.createTreeView('myTasksViewer', {
		treeDataProvider: myTaskListProvider,
		showCollapseAll: true
	});

	vscode.window.createTreeView('timeTracker', {
		treeDataProvider: timeTrackerListProvider,
		showCollapseAll: true
	});
	
}

function registerDecorators(context: vscode.ExtensionContext) {
	const taskFileDecorationProvider = new TaskItemDecorationProvider();
	context.subscriptions.push(taskFileDecorationProvider);
}

async function showQuickPick() {
	let i = 0;
	const result = await vscode.window.showQuickPick([
		{ label: 'one' },
		{ label: 'two' },
		{ label: 'three' },
	], {
		placeHolder: 'one, two or three',
		onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`), 
		canPickMany: true
	});
	vscode.window.showInformationMessage(`Got: ${result}`);
}

/**
 * Shows an input box using window.showInputBox().
 */
async function showInputBox() {
	const result = await vscode.window.showInputBox({
		value: 'abcdef',
		valueSelection: [2, 4],
		placeHolder: 'For example: fedcba. But not: 123',
		validateInput: text => {
			vscode.window.showInformationMessage(`Validating: ${text}`);
			return text === '123' ? 'Not 123!' : null;
		}
	});
	vscode.window.showInformationMessage(`Got: ${result}`);
}

export function deactivate() { }
