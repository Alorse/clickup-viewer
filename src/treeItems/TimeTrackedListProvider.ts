import * as vscode from 'vscode';
import { ApiWrapper } from '../lib/ApiWrapper';
import { Time, Team } from '../types';
import { formatTimeDuration } from '../lib/Timer';
import { TaskItem } from './timesItem/TaskItem';
import { TeamItem } from './items/TeamItem';
import { LocalStorageController } from '../controllers/LocalStorageController';

const MIN_HOURS_TRACKED_TODAY = 4;
const MIN_HOURS_TRACKED_LAST_WEEK = 15;

/**
 * Provides a tree data provider for displaying tracked time in a VS Code tree view.
 * Implements the `vscode.TreeDataProvider` interface for `vscode.TreeItem`.
 */
export class TimeTrackedListProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private readonly _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined
    > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    /**
     * Event emitter for signaling when the tree data has changed.
     */
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private apiwrapper: ApiWrapper;
    private teams: Team[];
    private trackedTimeToday?: Time[];
    private storageManager: LocalStorageController;
    private collapsedConst = vscode.TreeItemCollapsibleState;

    /**
     * Constructs a new `TimeTrackedListProvider`.
     * @param apiWrapper - The API wrapper for interacting with the backend.
     * @param teams - The list of teams to display tracked time for.
     * @param storageManager - The local storage controller.
     */
    constructor(
        apiWrapper: ApiWrapper,
        teams: Team[],
        storageManager: LocalStorageController,
    ) {
        this.apiwrapper = apiWrapper;
        this.teams = teams;
        this.storageManager = storageManager;
    }

    /**
     * Returns the tree item for the given element.
     * @param element - The tree item element.
     * @returns The tree item.
     */
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Returns the children of the given element.
     * @param element - The tree item element.
     * @returns A promise that resolves to an array of tree items.
     */
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

    /**
     * Retrieves the tracked time for today for the given team.
     * @param teamId - The ID of the team.
     * @returns A promise that resolves to an array of tracked time entries.
     */
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

    /**
     * Retrieves the tracked time for the last week for the given team.
     * @param teamId - The ID of the team.
     * @returns A promise that resolves to an array of tracked time entries.
     */
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

    /**
     * Retrieves the tracked time entries for the current month for a given team.
     *
     * @param teamId - The ID of the team for which to retrieve tracked time.
     * @returns A promise that resolves to an array of `Time` objects representing the tracked time entries for the current month.
     */
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

    /**
     * Retrieves and processes tracked time data for today, last week, and this month.
     *
     * @param resolve - An array of `vscode.TreeItem` to which the tracked time items will be added.
     * @param teamId - The ID of the team for which the tracked time is being retrieved.
     * @returns A promise that resolves when the tracked time data has been retrieved and processed.
     */
    private async getTrackedTime(
        resolve: Array<vscode.TreeItem>,
        teamId: string,
    ) {
        this.trackedTimeToday = await this.getTrackedTimeToday(teamId);
        this.headerItem(
            resolve,
            this.trackedTimeToday,
            'today',
            MIN_HOURS_TRACKED_TODAY,
        );
        for (const tracking of this.trackedTimeToday) {
            resolve.push(new TaskItem(tracking, this.collapsedConst.None));
        }

        const trackedTimeLastWeek = await this.getTrackedTimeLastWeek(teamId);
        this.headerItem(
            resolve,
            trackedTimeLastWeek,
            'last week',
            MIN_HOURS_TRACKED_LAST_WEEK,
        );

        const trackedTimeThisMonth = await this.getTrackedTimeThisMonth(teamId);
        this.headerItem(resolve, trackedTimeThisMonth, 'this month', false);
    }

    /**
     * Creates a header tree item for the tracked time interval and adds it to the resolve array.
     * @param resolve - The array to add the tree items to.
     * @param trackedTime - The array of tracked time entries.
     * @param interval - The time interval (e.g., 'today', 'last week', 'this month').
     * @param minHoursTracked - The minimum hours tracked for the interval.
     * @returns A promise that resolves to an array of tree items.
     */
    private headerItem(
        resolve: Array<vscode.TreeItem>,
        trackedTime: Time[],
        interval: string,
        minHoursTracked: number | boolean,
    ): Promise<vscode.TreeItem[]> {
        const totalTime = this.formatTrackingTotalDuration(trackedTime);
        const header = new vscode.TreeItem(
            `Tracked Time ${interval}: ${totalTime}`,
            this.collapsedConst.None,
        );
        header.iconPath = new vscode.ThemeIcon('history');

        if (typeof minHoursTracked === 'boolean' && minHoursTracked === false) {
            resolve.push(header);
            return Promise.resolve(resolve);
        }
        header.tooltip = `The minimun tracked time for ${interval} should be at least ${minHoursTracked} hours`;
        const totalDurationInSeconds =
            trackedTime.reduce(
                (acc, time) => acc + parseInt(time.duration, 10),
                0,
            ) / 1000;

        if (totalDurationInSeconds < 1 * 3600) {
            header.resourceUri = this.createViewDecorationUri('Overdue');
        } else if (
            typeof minHoursTracked === 'number' &&
            totalDurationInSeconds < minHoursTracked * 3600
        ) {
            header.resourceUri = this.createViewDecorationUri('ExpiresToday');
        }

        resolve.push(header);
        return Promise.resolve(resolve);
    }

    /**
     * Formats the total duration of tracked time.
     *
     * @param trackedTime - An array of Time objects, each containing a duration property.
     * @returns A formatted string representing the total duration.
     */
    private formatTrackingTotalDuration(trackedTime: Time[]): string {
        const totalDuration =
            trackedTime.reduce(
                (acc, time) => acc + parseInt(time.duration, 10),
                0,
            ) / 1000;
        return formatTimeDuration(totalDuration);
    }

    /**
     * Creates a URI for view decoration based on the overdue status.
     *
     * @param overdue - A string indicating the overdue status.
     * @returns A `vscode.Uri` object representing the view decoration URI.
     */
    private createViewDecorationUri(overdue: string): vscode.Uri {
        const scheme = 'clickup-viewer';
        const uriString = `${scheme}://time-tracked`;
        const uriQuery: { [key: string]: string } = {};
        uriQuery.color = `clickup.taskItemLabel${overdue}`;
        const uriObject = {
            scheme: scheme,
            authority: '',
            query: new URLSearchParams(uriQuery).toString(),
            fragment: '',
        };
        return vscode.Uri.parse(`${uriString}?${uriObject.query}`);
    }
}
