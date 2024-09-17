import * as vscode from 'vscode';
import { Team, Task} from '../types';
import { TaskItem } from './items/task_item';
import { ApiWrapper } from '../lib/apiWrapper';

export class MyTaskListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    apiwrapper: ApiWrapper;
    teams: Team[];
    userId: number;

    constructor(apiWrapper: ApiWrapper, teams: Array<Team>, userId: number) {
        this.apiwrapper = apiWrapper;
        this.userId = userId;
        this.teams = teams;
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: (Task)): Promise<(vscode.TreeItem)[]> {
        const resolve: Array<TaskItem> = [];
        for (const team of this.teams) {
            const tasks: Array<Task> = await this.apiwrapper.getMyTask(team.id, this.userId.toString(), true);
            for (const task of tasks) {
                resolve.push(new TaskItem(task));
            }

        }

        return Promise.resolve(resolve);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> = new vscode.EventEmitter<undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

}