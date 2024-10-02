import * as vscode from 'vscode';
import { Team, Space, Folder, List, Task} from '../types';
import { TaskItem } from './items/TaskItem';
import { ListItem } from './items/ListItem';
import { SpaceItem } from './items/SpaceItem';
import { TeamItem } from './items/TeamItem';
import { FolderItem } from './items/FolderItem';
import { ApiWrapper } from '../lib/ApiWrapper';
import { LocalStorageController } from '../controllers/LocalStorageController';
import { ItemsController } from '../controllers/ItemsController';

export class TaskListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    teams: Team[];
    apiWrapper: ApiWrapper;
    storageManager: LocalStorageController;
    itemsController: ItemsController;

    collapsedConst = vscode.TreeItemCollapsibleState.Collapsed;
    noCollapsedConst = vscode.TreeItemCollapsibleState.None;

    constructor(teams: Team[], apiWrapper: ApiWrapper, storageManager: LocalStorageController) {
        this.teams = teams;
        this.apiWrapper = apiWrapper;
        this.storageManager = storageManager;
        this.itemsController = new ItemsController(apiWrapper, storageManager);
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: (Space)): Promise<(vscode.TreeItem)[]> {
        let resolve: any = [];

        if (element === undefined) {
            resolve = Object.values(this.teams).map((team: Team) => {
                return new TeamItem(team.id, team, this.collapsedConst, this.storageManager);
            });
            return Promise.resolve(resolve);
        }

        if (element instanceof TeamItem) {
            const spaces: Space[] = await this.itemsController.getSpaces(element.id);
            resolve = Object.values(spaces).map((space: Space) => {
                return new SpaceItem(space, this.collapsedConst);
            });
        }

        if (element instanceof SpaceItem) {
            const folders: Folder[] = await this.apiWrapper.getFolders(element.id);
            resolve = Object.values(folders).map((folder: Folder) => {
                return new FolderItem(folder, this.collapsedConst);
            });
            const lists: List[] = await this.apiWrapper.getFolderLists(element.id);
            await Promise.all(
                Object.values(lists).map(async (list: List) => {
                    const taskCount = await this.apiWrapper.countTasks(list.id);
                    resolve.push(new ListItem(list, this.collapsedConst, taskCount));
                })
            );

        }

        if (element instanceof FolderItem) {
            const lists: List[] = await this.apiWrapper.getLists(element.folder.id);
            await Promise.all(
                Object.values(lists).map(async (list: List) => {
                    //* Fetches the task count for the list
                    const taskCount = await this.apiWrapper.countTasks(list.id);
                    resolve.push(new ListItem(list, this.collapsedConst, taskCount));
                })
            );
        }

        if (element instanceof ListItem) {
            const tasks: Task[] = await this.apiWrapper.getTasks(element.list.id);
            for (const task of tasks) {
                resolve.push(new TaskItem(task, this.noCollapsedConst));
            }
        }

        return Promise.resolve(resolve);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> = new vscode.EventEmitter<undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this.itemsController.resetTeams();
        this._onDidChangeTreeData.fire();
    }

}