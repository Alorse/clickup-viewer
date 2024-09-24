import * as vscode from 'vscode';
import { ApiWrapper } from '../lib/ApiWrapper';
import { TrackingItem } from './timesItem/TrackingItem';
import { IntervalItem } from './timesItem/IntervalItem';
import { Task, Tracking } from '../types';
import { formatTrackingDuration } from '../lib/timer';

const collapsedConst = vscode.TreeItemCollapsibleState.Collapsed;
const noCollapsedConst = vscode.TreeItemCollapsibleState.None;

export class TimeTrackerListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    public task?: Task;
    private apiwrapper: ApiWrapper;
    private currentTracking?: Tracking[];

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

        if (element === undefined) {
            this.currentTracking = await this.apiwrapper.getTrackedTime(this.task.id);
            this.headerItem(resolve, this.currentTracking, this.task);
            if (this.currentTracking.length === 1) {
                for (const interval of this.currentTracking [0].intervals) {
                    resolve.push(new IntervalItem(interval, noCollapsedConst));
                }
            } else {
                for (const tracking of this.currentTracking ) {
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

    private headerItem(resolve: Array<vscode.TreeItem>, trackedTime: Tracking[], task: Task): Promise<(vscode.TreeItem)[]>  {
        const totalTime = formatTrackingDuration(trackedTime);
        const header = new vscode.TreeItem(`Total Time: ${totalTime}`, noCollapsedConst);
        header.id = task.id;
        header.iconPath = new vscode.ThemeIcon('server');
        header.tooltip = `${task.name} (${totalTime})`;
        header.command = {
            command: 'TimeTrackingTask', // Does not matter
            title: '',
            arguments: [task, trackedTime] // Only this matters
        };
        header.contextValue = 'timeTracker';
        resolve.push(header);
        const subHeader = new vscode.TreeItem('', noCollapsedConst);
        subHeader.description = task.name;
        subHeader.tooltip = `${task.name} (${totalTime})`;
        resolve.push(subHeader);
        return Promise.resolve(resolve);
    }
}