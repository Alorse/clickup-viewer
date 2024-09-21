import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import * as translations from '../l10n/bundle.l10n.json';
import { LocalStorageService } from './lib/localStorageService';
import { TaskListProvider } from './treeItems/taskListProvider';
import { MyTaskListProvider } from './treeItems/myTaskListProvider';
import { TaskItemDecorationProvider } from './providers/TaskItemDecorationProvider';
import { TimeTrackerListProvider } from './treeItems/TimeTrackerListProvider';
import TokenManager from './lib/tokenManager';
import { ApiWrapper } from './lib/apiWrapper';
import { User, Team, Task } from './types';
import { OpenTaskPanel } from './panelItems/openTaskPanel';
import { TaskController } from './controllers/TaskController';

let storageManager: LocalStorageService;
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

	storageManager = new LocalStorageService(context.workspaceState);
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
		taskController.selectTasks(taskItem.command.arguments[0]);
	});

}

function startTreeViews() {
	vscode.window.createTreeView('spacesViewer', {
		treeDataProvider: taskListProvider,
		showCollapseAll: true,
	});

	setTimeout(() => {
		console.log("Refreshing task list...");
		taskListProvider.refresh();
	}, 500);

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

export function deactivate() { }
