import * as vscode from 'vscode';
import { Team, Space, Folder, List, Task} from '../types';
import { TaskItem } from './items/task_item';
import { ListItem } from './items/list_item';
import { SpaceItem } from './items/space_item';
import { TeamItem } from './items/team_item';
import { FolderItem } from './items/folder_item';
import { ApiWrapper } from '../lib/apiWrapper';
import { LocalStorageService } from '../lib/localStorageService';

export class TaskListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    teams: Team[];
    apiwrapper: ApiWrapper;
    storageManager: LocalStorageService;

    collapsedConst = vscode.TreeItemCollapsibleState.Collapsed;
    noCollapsedConst = vscode.TreeItemCollapsibleState.None;

    constructor(teams: Team[], apiWrapper: ApiWrapper, storageManager: LocalStorageService) {
        this.teams = teams;
        this.apiwrapper = apiWrapper;
        this.storageManager = storageManager;
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: (Space)): Promise<(vscode.TreeItem)[]> {
        var resolve: any = [];

        if (element === undefined) {
            resolve = Object.values(this.teams).map((team: Team) => {
                return new TeamItem(team.id, team, this.collapsedConst, this.storageManager);
            });
            return Promise.resolve(resolve);
        }

        if (element instanceof TeamItem) {
            var spaces: Space[] = await this.apiwrapper.getSpaces(element.id);
            resolve = Object.values(spaces).map((space: Space) => {
                return new SpaceItem(space, this.collapsedConst);
            });
        }

        if (element instanceof SpaceItem) {
            var folders: Folder[] = await this.apiwrapper.getFolders(element.id);
            resolve = Object.values(folders).map((folder: Folder) => {
                return new FolderItem(folder, this.collapsedConst);
            });
            var lists: List[] = await this.apiwrapper.getFolderLists(element.id);
            await Promise.all(
                Object.values(lists).map(async (list: List) => {
                    var taskCount = await this.apiwrapper.countTasks(list.id);
                    resolve.push(new ListItem(list, this.collapsedConst, taskCount));
                })
            );

        }

        if (element instanceof FolderItem) {
            var lists: List[] = await this.apiwrapper.getLists(element.folder.id);
            await Promise.all(
                Object.values(lists).map(async (list: List) => {
                    //* Fetches the task count for the list
                    var taskCount = await this.apiwrapper.countTasks(list.id);
                    resolve.push(new ListItem(list, this.collapsedConst, taskCount));
                })
            );
        }

        if (element instanceof ListItem) {
            var tasks: Task[] = await this.apiwrapper.getTasks(element.list.id);
            for (const task of tasks) {
                resolve.push(new TaskItem(task, this.noCollapsedConst));
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