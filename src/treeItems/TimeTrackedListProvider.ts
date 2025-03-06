import * as vscode from 'vscode';
import { ApiWrapper } from '../lib/ApiWrapper';
import { Time, Team } from '../types';
import { formatTimeDuration } from '../lib/Timer';
import { TaskItem } from './timesItem/TaskItem';
import { TeamItem } from './items/TeamItem';
import { LocalStorageController } from '../controllers/LocalStorageController';

export class TimeTrackedListProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private readonly _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined
    > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private apiwrapper: ApiWrapper;
    private teams: Team[];
    private trackedTimeToday?: Time[];
    private storageManager: LocalStorageController;
    private collapsedConst = vscode.TreeItemCollapsibleState;

    constructor(
        apiWrapper: ApiWrapper,
        teams: Team[],
        storageManager: LocalStorageController,
    ) {
        this.apiwrapper = apiWrapper;
        this.teams = teams;
        this.storageManager = storageManager;
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        let resolve: any = [];

        if (element === undefined && this.teams.length === 1) {
            const teamId = this.teams[0].id;
            await this.getTrackedTime(resolve, teamId);
        }

        if (element === undefined) {
            resolve = Object.values(this.teams).map(
                (team: Team, index: number) => {
                    const collapsibleState =
                        index === 0
                            ? this.collapsedConst.Expanded
                            : this.collapsedConst.Collapsed;
                    return new TeamItem(
                        team.id,
                        team,
                        collapsibleState,
                        this.storageManager,
                    );
                },
            );
        }

        if (element instanceof TeamItem) {
            await this.getTrackedTime(resolve, element.team.id);
        }

        return Promise.resolve(resolve);
    }

    async getTrackedTimeToday(teamId: string): Promise<Time[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const trackedTime = await this.apiwrapper.getTimeEntries(teamId, {
            start_date: startOfDay.getTime(),
            end_date: endOfDay.getTime(),
        });
        return trackedTime;
    }

    async getTrackedTimeLastWeek(teamId: string): Promise<Time[]> {
        const today = new Date();
        const startOfWeek = new Date(
            today.setDate(today.getDate() - today.getDay()),
        );
        const endOfWeek = new Date(
            today.setDate(today.getDate() - today.getDay() + 6),
        );
        const trackedTime = await this.apiwrapper.getTimeEntries(teamId, {
            start_date: startOfWeek.getTime(),
            end_date: endOfWeek.getTime(),
        });
        return trackedTime;
    }

    async getTrackedTimeThisMonth(teamId: string): Promise<Time[]> {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
        );
        const trackedTime = await this.apiwrapper.getTimeEntries(teamId, {
            start_date: startOfMonth.getTime(),
            end_date: endOfMonth.getTime(),
        });
        return trackedTime;
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    private async getTrackedTime(
        resolve: Array<vscode.TreeItem>,
        teamId: string,
    ) {
        this.trackedTimeToday = await this.getTrackedTimeToday(teamId);
        this.headerItem(resolve, this.trackedTimeToday, 'today');
        for (const tracking of this.trackedTimeToday) {
            resolve.push(new TaskItem(tracking, this.collapsedConst.None));
        }

        const trackedTimeLastWeek = await this.getTrackedTimeLastWeek(teamId);
        this.headerItem(resolve, trackedTimeLastWeek, 'last week');

        const trackedTimeThisMonth = await this.getTrackedTimeThisMonth(teamId);
        this.headerItem(resolve, trackedTimeThisMonth, 'this month');
    }

    private headerItem(
        resolve: Array<vscode.TreeItem>,
        trackedTime: Time[],
        interval: string = 'today',
    ): Promise<vscode.TreeItem[]> {
        const totalTime = this.formatTrackingTotalDuration(trackedTime);
        const header = new vscode.TreeItem(
            `Tracked Time ${interval}: ${totalTime}`,
            this.collapsedConst.None,
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
