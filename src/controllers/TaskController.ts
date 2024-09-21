import * as vscode from 'vscode';
import { Task, Time } from '../types';
import Timer from '../lib/timer';
import { ApiWrapper } from '../lib/apiWrapper';
import { StatusChanger } from '../lib/statusChanger';
import { TaskStatusBarItem } from '../lib/taskStatusBarItem';
import { LocalStorageService } from '../lib/localStorageService';
import { TimeTrackerListProvider } from '../treeItems/TimeTrackerListProvider';

export class TaskController {
    private _forgetTask: vscode.Disposable;
    private storageManager: LocalStorageService;
    private taskStatusBarItem: TaskStatusBarItem;
    private selectedTaskData: Task | undefined;
    private statusChanger: StatusChanger;
    private apiWrapper: ApiWrapper;
    private timer?: Timer;
    private timeTrackerListProvider: TimeTrackerListProvider;


    constructor( wrapper: ApiWrapper, storageManager: LocalStorageService, timeTrackerListProvider: TimeTrackerListProvider) {
        this.apiWrapper = wrapper;
        this.storageManager = storageManager;
        this.statusChanger = new StatusChanger(wrapper);
        this.taskStatusBarItem = new TaskStatusBarItem();
        this.timeTrackerListProvider = timeTrackerListProvider;
        this._forgetTask = vscode.commands.registerCommand('clickup.forgetTask', () => {
            this.forgetTask(false);
        });
    }

    public async selectTasks(task: Task) {
        const limitLength = 30;
        let localTask: Task = task;
        // Checks that the saved task data is complete, if not, reloads it
        if (!task.url) {
            const remoteTask = await this.apiWrapper.getTasks(task.id);
            // Save last TaskId and ListId value
            this.storageManager.setValue('selectedTaskData', remoteTask);
            localTask = remoteTask[0];
        }
        let message = "";
        if (task.name) {
            message = localTask.name.length > limitLength ? `${localTask.name.substring(0, limitLength)}...` : localTask.name;
        }
        this.taskStatusBarItem.setText(`$(pinned) ${message}`);
        this.taskStatusBarItem.setTooltip(`[${localTask.custom_id ? localTask.custom_id : localTask.id }] ${localTask.name}`);
        this.taskStatusBarItem.setCommand("clickup.openTask", task);
    
        //save last TaskId and ListId value
        this.storageManager.setValue('selectedTaskData', localTask);
    
        if (this.apiWrapper) {
            this.timer?.destroy();
            this.timer = new Timer(
                localTask,
                this.apiWrapper,
                () => { },
                () => {
                    this.timeTrackerListProvider.refresh();
                });
            this.restoreTimer(localTask.team_id, localTask.id);
        }
    }
    
    public async forgetTask(showMessage: boolean) {
        this.taskStatusBarItem.setDefaults();
        this.selectedTaskData = undefined;
        this.statusChanger.itemsList.task.id = undefined;
        this.storageManager.setValue('selectedTaskData', undefined);
        this.storageManager.setValue('listOfTaskId', undefined);
        if (showMessage) {
            vscode.window.showInformationMessage('Task forgotten');
        }
    }

    public restoreTimer(teamId: string, taskId: string) {
        if (!teamId) {
            console.log("No `teamId` found to restore time");
            return;
        }
        this.apiWrapper.getRunningTime(teamId).then((time: Time) => {
            if (time && time.task.id === taskId) {
                this.timer?.restore(parseInt(time.start));
            }
        });
    }

    public dispose() {
        this._forgetTask.dispose();
    }
}
