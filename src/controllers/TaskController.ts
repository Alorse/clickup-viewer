import * as vscode from 'vscode';
import { Task, Time, Tracking } from '../types';
import Timer from '../lib/Timer';
import { ApiWrapper } from '../lib/ApiWrapper';
import { TaskStatusBarItem } from '../lib/TaskStatusBarItem';
import { LocalStorageController } from './LocalStorageController';
import { TimeTrackerListProvider } from '../treeItems/TimeTrackerListProvider';

export class TaskController {
    private _forgetTask: vscode.Disposable;
    private storageManager: LocalStorageController;
    private taskStatusBarItem: TaskStatusBarItem;
    private selectedTaskData: Task | undefined;
    private apiWrapper: ApiWrapper;
    private timer?: Timer;
    private timeTrackerListProvider: TimeTrackerListProvider;


    constructor( wrapper: ApiWrapper, storageManager: LocalStorageController, timeTrackerListProvider: TimeTrackerListProvider) {
        this.apiWrapper = wrapper;
        this.storageManager = storageManager;
        this.taskStatusBarItem = new TaskStatusBarItem();
        this.timeTrackerListProvider = timeTrackerListProvider;
        this._forgetTask = vscode.commands.registerCommand('clickup.forgetTask', () => {
            this.forgetTask(false);
        });
    }

    public async selectTasks(params: [Task, Tracking[]], ifFromStorage: boolean = false) {
        const task = params[0];
        const currentTracking = params[1];
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
                currentTracking,
                this.apiWrapper,
                () => { },
                () => {
                    this.timeTrackerListProvider.refresh();
                });
            this.restoreTimer(localTask.team_id, localTask.id);
            if (!ifFromStorage) {
                this.startTimer();
            }
        }
    }

    /**
     * Initialize the selected task from storage.
     * If the task is found, it starts the timer.
     */
    public async initSelectedTask() {
        this.selectedTaskData = await this.storageManager.getValue('selectedTaskData');
        if (this.selectedTaskData) {
            const trakingTime = await this.apiWrapper.getTrackedTime(this.selectedTaskData.id);
            if (trakingTime) {
                this.selectTasks([this.selectedTaskData, trakingTime], true);
            }
            
        }
    }
    
    public async forgetTask(showMessage: boolean) {
        this.taskStatusBarItem.setDefaults();
        this.selectedTaskData = undefined;
        this.storageManager.setValue('selectedTaskData', undefined);
        this.storageManager.setValue('listOfTaskId', undefined);
        if (showMessage) {
            vscode.window.showInformationMessage('Task forgotten');
        }
    }

    public restoreTimer(teamId: string, taskId: string) {
        if (!teamId) {
            return;
        }
        this.apiWrapper.getRunningTime(teamId).then((time: Time) => {
            if (time && time.task.id === taskId) {
                this.timer?.restore(parseInt(time.start));
            }
        });
    }

    /**
     * Starts the timer for the currently selected task.
     * If the timer is not currently running, this function will start it.
     * If the timer is already running, this function has no effect.
     */
    public startTimer() {
        if (this.timer) {
            this.timer.start();
        }
    }


    /**
     * Stops the timer for the currently selected task.
     * If the timer is not currently running, this function has no effect.
     * If the timer is already running, this function will stop it.
     */
    public stopTimer() {
        if (this.timer) {
            this.timer.stop();
        }
    }

    public dispose() {
        this._forgetTask.dispose();
    }
}
