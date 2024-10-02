import * as vscode from 'vscode';
import { Team, Task } from '../types';
import { TaskItem } from './items/TaskItem';
import { TeamItem } from './items/TeamItem';
import { ApiWrapper } from '../lib/ApiWrapper';
import { LocalStorageController } from '../controllers/LocalStorageController';

export class MyTaskListProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    apiwrapper: ApiWrapper;
    teams: Team[];
    userId: number;
    storageManager: LocalStorageController;
    collapsedConst = vscode.TreeItemCollapsibleState.Collapsed;

    constructor(
        apiWrapper: ApiWrapper,
        teams: Array<Team>,
        userId: number,
        storageManager: LocalStorageController,
    ) {
        this.apiwrapper = apiWrapper;
        this.userId = userId;
        this.teams = teams;
        this.storageManager = storageManager;
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: Team | Task): Promise<vscode.TreeItem[]> {
        const filteredSpaces = [90020068902];
        // SingleTeam
        // If there is only one team, show all its tasks without creating a TeamItem
        if (element === undefined && this.teams.length === 1) {
            const tasks: Task[] = await this.apiwrapper.getMyTask(
                this.teams[0].id,
                this.userId.toString(),
                filteredSpaces,
                true,
            );
            return Promise.resolve(
                tasks.map((task: Task) => new TaskItem(task)),
            );
        }
        // MultiTeam
        // If there are more than one team, create a TeamItem for each one
        // then show the corresponding tasks inside each one
        let resolve: any = [];
        if (element === undefined) {
            resolve = Object.values(this.teams).map((team: Team) => {
                return new TeamItem(
                    team.id,
                    team,
                    this.collapsedConst,
                    this.storageManager,
                );
            });
        }
        if (element instanceof TeamItem) {
            const tasks: Task[] = await this.apiwrapper.getMyTask(
                element.team.id,
                this.userId.toString(),
                filteredSpaces,
                true,
            );
            for (const task of tasks) {
                resolve.push(new TaskItem(task));
            }
        }

        return Promise.resolve(resolve);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
        new vscode.EventEmitter<undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
        this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
