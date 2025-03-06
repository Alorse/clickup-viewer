import * as vscode from 'vscode';
import { ApiWrapper } from '../lib/ApiWrapper';
import { Time, User } from '../types';
import { formatTimeDuration } from '../lib/Timer';
import { TaskItem } from './timesItem/TaskItem';

const noCollapsedConst = vscode.TreeItemCollapsibleState.None;

export class TimeTrackedListProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private readonly _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined
    > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private apiwrapper: ApiWrapper;
    private user: User;
    private trackedTimeToday?: Time[];

    constructor(apiWrapper: ApiWrapper, user: User) {
        this.apiwrapper = apiWrapper;
        this.user = user;
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        const resolve: Array<vscode.TreeItem> = [];

        if (element === undefined) {
            this.trackedTimeToday = await this.getTrackedTimeToday();
            this.headerItem(resolve, this.trackedTimeToday, 'today');
            for (const tracking of this.trackedTimeToday) {
                resolve.push(new TaskItem(tracking, noCollapsedConst));
            }

            const trackedTimeLastWeek = await this.getTrackedTimeLastWeek();
            this.headerItem(resolve, trackedTimeLastWeek, 'last week');

            const trackedTimeThisMonth = await this.getTrackedTimeThisMonth();
            this.headerItem(resolve, trackedTimeThisMonth, 'this month');
        }

        return Promise.resolve(resolve);
    }

    async getTrackedTimeToday(): Promise<Time[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const trackedTime = await this.apiwrapper.getTimeEntries('529', {
            start_date: startOfDay.getTime(),
            end_date: endOfDay.getTime(),
        });
        // eslint-disable-next-line no-console
        console.log('Today', trackedTime);
        return trackedTime;
    }

    async getTrackedTimeLastWeek(): Promise<Time[]> {
        const today = new Date();
        const startOfWeek = new Date(
            today.setDate(today.getDate() - today.getDay()),
        );
        const endOfWeek = new Date(
            today.setDate(today.getDate() - today.getDay() + 6),
        );
        const trackedTime = await this.apiwrapper.getTimeEntries('529', {
            start_date: startOfWeek.getTime(),
            end_date: endOfWeek.getTime(),
        });
        // eslint-disable-next-line no-console
        console.log('Last Week', trackedTime);
        return trackedTime;
    }

    async getTrackedTimeThisMonth(): Promise<Time[]> {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
        );
        const trackedTime = await this.apiwrapper.getTimeEntries('529', {
            start_date: startOfMonth.getTime(),
            end_date: endOfMonth.getTime(),
        });
        return trackedTime;
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    private headerItem(
        resolve: Array<vscode.TreeItem>,
        trackedTime: Time[],
        interval: string = 'today',
    ): Promise<vscode.TreeItem[]> {
        const totalTime = this.formatTrackingTotalDuration(trackedTime);
        const header = new vscode.TreeItem(
            `Tracked Time ${interval}: ${totalTime}`,
            noCollapsedConst,
        );
        header.iconPath = new vscode.ThemeIcon('history');
        header.tooltip = `Tracked time ${interval}: ${trackedTime}`;
        resolve.push(header);
        return Promise.resolve(resolve);
    }

    private formatTrackingTotalDuration(trackedTime: Time[]): string {
        const totalDuration =
            trackedTime.reduce(
                (acc, time) => acc + parseInt(time.duration, 10),
                0,
            ) / 1000;
        return formatTimeDuration(totalDuration);
    }
}
