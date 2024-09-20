import * as vscode from 'vscode';
import { Task } from '../types';
import { ApiWrapper } from '../lib/apiWrapper';
// import { TASK_FORGOTTEN } from '../constants';
import { StatusChanger } from '../lib/statusChanger';
import { TaskStatusBarItem } from '../lib/taskStatusBarItem';
import { LocalStorageService } from '../lib/localStorageService';

export class TaskController {
    private _forgetTask: vscode.Disposable;
    private storageManager: LocalStorageService;
    private taskStatusBarItem: TaskStatusBarItem;
    private selectedTaskData: Task | undefined;
    private statusChanger: StatusChanger;
    private apiWrapper: ApiWrapper;


    constructor( wrapper: ApiWrapper, storageManager: LocalStorageService) {
        this.apiWrapper = wrapper;
        this.storageManager = storageManager;
        this.statusChanger = new StatusChanger(wrapper);
        this.taskStatusBarItem = new TaskStatusBarItem();
        this._forgetTask = vscode.commands.registerCommand('clickup.forgetTask', () => {
            this.forgetTask(false);
        });
    }

    public dispose() {
        this._forgetTask.dispose();
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
}
