import * as vscode from 'vscode';
import { ApiWrapper } from '../lib/apiWrapper';
import { TrackingItem } from './timesItem/trackingItem';
import { IntervalItem } from './timesItem/intervalItem';
import { Task, Tracking } from '../types';
import { formatTrackingDuration } from '../lib/timer';

const collapsedConst = vscode.TreeItemCollapsibleState.Collapsed;
const noCollapsedConst = vscode.TreeItemCollapsibleState.None;

export class TimeTrackerListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    task?: Task;
    apiwrapper: ApiWrapper;

    constructor(apiWrapper: ApiWrapper, task?: Task) {
        this.task = task;
        this.apiwrapper = apiWrapper;
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<(vscode.TreeItem)[]> {
        const resolve: Array<vscode.TreeItem> = [];
        if (!this.task) {
            const noTaskItem = new vscode.TreeItem('Select a task to track', noCollapsedConst);
            noTaskItem.iconPath = new vscode.ThemeIcon('history');
            resolve.push(noTaskItem);
            return Promise.resolve(resolve);
        }

        const trackedTime : Tracking[] = await this.apiwrapper.getTrackedTime(this.task.id);
        if (element === undefined) {
            this.headerItem(resolve, trackedTime, this.task.name);
            if (trackedTime.length === 1) {
                for (const interval of trackedTime[0].intervals) {
                    resolve.push(new IntervalItem(interval, noCollapsedConst));
                }
            } else {
                for (const tracking of trackedTime) {
                    resolve.push(new TrackingItem(tracking, collapsedConst));
                }
            }
        }

        if (element instanceof TrackingItem) {
            for (const interval of element.trackingItem.intervals) {
                resolve.push(new IntervalItem(interval, noCollapsedConst));
            }
            return resolve;
        }

        return Promise.resolve(resolve);
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    private headerItem(resolve: Array<vscode.TreeItem>, trackedTime: Tracking[], taskName: string): Promise<(vscode.TreeItem)[]>  {
        const totalTime = formatTrackingDuration(trackedTime);
        const header = new vscode.TreeItem(`Total Time: ${totalTime}`, noCollapsedConst);
        header.iconPath = new vscode.ThemeIcon('server');
        header.tooltip = `${taskName} (${totalTime})`;
        header.contextValue = 'timeTracker';
        resolve.push(header);
        const subHeader = new vscode.TreeItem('', noCollapsedConst);
        subHeader.description = taskName;
        subHeader.tooltip = `${taskName} (${totalTime})`;
        resolve.push(subHeader);
        return Promise.resolve(resolve);
    }
}