import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import * as translations from '../l10n/bundle.l10n.json';
import { LocalStorageController } from './controllers/LocalStorageController';
import { TaskListProvider } from './treeItems/TaskListProvider';
import { MyTaskListProvider } from './treeItems/MyTaskListProvider';
import { TaskItemDecorationProvider } from './providers/TaskItemDecorationProvider';
import { TimeTrackerListProvider } from './treeItems/TimeTrackerListProvider';
import { TimeTrackedListProvider } from './treeItems/TimeTrackedListProvider';
import TokenManager from './lib/TokenManager';
import { ApiWrapper } from './lib/ApiWrapper';
import { User, Team, Task } from './types';
import { OpenTaskPanel } from './panelItems/OpenTaskPanel';
import { TaskController } from './controllers/TaskController';
import { ItemsController } from './controllers/ItemsController';
import { PicksController } from './controllers/PicksController';

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
let timeTrackedListProvider: TimeTrackedListProvider;
let itemsController: ItemsController;
let picksController: PicksController;
let context: vscode.ExtensionContext;

export async function activate(rootContext: vscode.ExtensionContext) {
    l10n.config({
        contents: translations,
    });
    context = rootContext;
    storageManager = new LocalStorageController(context.workspaceState);
    tokenManager = new TokenManager(l10n);
    token = await tokenManager.init();

    if (token) {
        apiWrapper = new ApiWrapper(token);
        me = await apiWrapper.getUser();
        startExtensions();
    }

    vscode.commands.registerCommand('clickup.setToken', async () => {
        if (await tokenManager.askToken()) {
            const token = await tokenManager.getToken();
            if (token) {
                try {
                    apiWrapper = new ApiWrapper(token);
                    me = await apiWrapper.getUser();
                    vscode.window.showInformationMessage(
                        `${l10n.t('SET_TOKEN')} ${me.username}`,
                    );
                    startExtensions();
                } catch (error) {
                    vscode.window.showErrorMessage(l10n.t('INVALID_TOKEN'));
                    // eslint-disable-next-line no-console
                    console.log((<Error>error).message);
                }
            }
        }
    });

    vscode.commands.registerCommand('clickup.getToken', async () => {
        const token = await tokenManager.getToken();
        if (!token) {
            vscode.window.showInformationMessage(l10n.t('TOKEN_NOT_FOUND'));
        } else {
            vscode.window.showInformationMessage(
                l10n.t('YOUR_TOKEN {0}', token),
            );
        }
    });

    vscode.commands.registerCommand('clickup.deleteToken', async () => {
        if (await tokenManager.delete()) {
            vscode.window.showInformationMessage(
                'ClickUp API Token deleted, bye bye!',
            );
        }
    });

    vscode.commands.registerCommand('clickup.openTask', async (task: Task) => {
        new OpenTaskPanel(task, storageManager);
    });

    vscode.commands.registerCommand('clickup.refreshSpaces', async () => {
        taskListProvider.refresh();
    });

    vscode.commands.registerCommand('clickup.refreshMyTasks', () => {
        myTaskListProvider.refresh();
    });

    vscode.commands.registerCommand('clickup.openInWeb', (taskItem) => {
        if (taskItem.task.url) {
            vscode.env.openExternal(vscode.Uri.parse(taskItem.task.url));
        }
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

    vscode.commands.registerCommand(
        'clickup.filterMyTaskSpaces',
        async (teamItem) => {
            const spaces = await itemsController.getSpaces(teamItem.id);
            const picked = await picksController.showQuickPick(
                teamItem.id,
                spaces,
            );
            if (picked) {
                myTaskListProvider.refresh();
            }
        },
    );

    vscode.commands.registerCommand(
        'clickup.showTrackedTimeToday',
        async () => {
            const items = await timeTrackedListProvider.getTrackedTimeToday();
            vscode.window.showQuickPick(
                items.map((item) => item.user.username),
            );
        },
    );

    vscode.commands.registerCommand(
        'clickup.showTrackedTimeLastWeek',
        async () => {
            const items =
                await timeTrackedListProvider.getTrackedTimeLastWeek();
            vscode.window.showQuickPick(
                items.map((item) => item.user.username),
            );
        },
    );

    vscode.commands.registerCommand(
        'clickup.showTrackedTimeThisMonth',
        async () => {
            const items =
                await timeTrackedListProvider.getTrackedTimeThisMonth();
            vscode.window.showQuickPick(
                items.map((item) => item.user.username),
            );
        },
    );
}

async function startExtensions() {
    itemsController = new ItemsController(apiWrapper, storageManager);
    picksController = new PicksController(storageManager);

    teams = await itemsController.getTeams();
    taskListProvider = new TaskListProvider(teams, apiWrapper, storageManager);
    myTaskListProvider = new MyTaskListProvider(
        apiWrapper,
        teams,
        me.id,
        storageManager,
    );
    timeTrackerListProvider = new TimeTrackerListProvider(apiWrapper);
    timeTrackedListProvider = new TimeTrackedListProvider(apiWrapper, teams);

    taskController = new TaskController(
        apiWrapper,
        storageManager,
        timeTrackerListProvider,
    );
    taskController.initSelectedTask();

    registerDecorators(context);
    startTreeViews();
}

function startTreeViews() {
    vscode.window.createTreeView('spacesViewer', {
        treeDataProvider: taskListProvider,
        showCollapseAll: true,
    });

    vscode.window.createTreeView('myTasksViewer', {
        treeDataProvider: myTaskListProvider,
        showCollapseAll: true,
    });

    vscode.window.createTreeView('timeTracker', {
        treeDataProvider: timeTrackerListProvider,
        showCollapseAll: true,
    });

    vscode.window.createTreeView('myTimeTracked', {
        treeDataProvider: timeTrackedListProvider,
        showCollapseAll: true,
    });
}

function registerDecorators(context: vscode.ExtensionContext) {
    const taskFileDecorationProvider = new TaskItemDecorationProvider();
    context.subscriptions.push(taskFileDecorationProvider);
}

export function deactivate() {}
