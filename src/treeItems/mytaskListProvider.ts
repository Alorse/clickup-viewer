import * as vscode from 'vscode';
import { Team, Task } from '../types';
import { TaskItem } from './items/task_item';
import { TeamItem } from './items/team_item';
import { ApiWrapper } from '../lib/apiWrapper';
import { LocalStorageService } from '../lib/localStorageService';

export class MyTaskListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    apiwrapper: ApiWrapper;
    teams: Team[];
    userId: number;
    storageManager: LocalStorageService;
    collapsedConst = vscode.TreeItemCollapsibleState.Collapsed;

    constructor(apiWrapper: ApiWrapper, teams: Array<Team>, userId: number, storageManager: LocalStorageService) {
        this.apiwrapper = apiWrapper;
        this.userId = userId;
        this.teams = teams;
        this.storageManager = storageManager;
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: (Team | Task)): Promise<(vscode.TreeItem)[]> {
        if (element === undefined && this.teams.length === 1) {
            const tasks: Task[] = await this.apiwrapper.getMyTask(this.teams[0].id, this.userId.toString(), true);
            return Promise.resolve(tasks.map((task: Task) => new TaskItem(task)));
        }
        let resolve: any = [];
        if (element === undefined) {
            resolve = Object.values(this.teams).map((team: Team) => {
                return new TeamItem(team.id, team, this.collapsedConst, this.storageManager);
            });
        }
        if (element instanceof TeamItem) {
            const tasks: Task[] = await this.apiwrapper.getMyTask(element.team.id, this.userId.toString(), true);
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
