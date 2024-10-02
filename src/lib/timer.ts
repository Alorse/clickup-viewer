import {
    StatusBarItem,
    window,
    env,
    StatusBarAlignment,
    ThemeColor,
} from 'vscode';
import { ApiWrapper } from './ApiWrapper';
import { CreateTime, Task, Interval, Tracking } from '../types';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

const DEFAULT_TIME = '00:00:00';
const FORMAT_TIME = 'HH:mm:ss';

dayjs.extend(duration);

export default class Timer {
    private _statusBarItem!: StatusBarItem;
    private _statusBarStartButton!: StatusBarItem;

    private _timer!: NodeJS.Timeout;
    private startDate: number;

    private task: Task;
    private apiWrapper: ApiWrapper;

    private startCallback?: CallableFunction;
    private stopCallback?: CallableFunction;

    constructor(
        task: Task,
        currentTracking: Tracking[],
        apiWrapper: ApiWrapper,
        startCallback?: CallableFunction,
        stopCallback?: CallableFunction,
    ) {
        this.task = task;
        this.apiWrapper = apiWrapper;
        this.startDate = 0;

        this.startCallback = startCallback;
        this.stopCallback = stopCallback;
        const taskId = task.custom_id ? task.custom_id : task.id;
        const totalTime = formatTrackingDuration(currentTracking);

        // create status bar items
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(
                StatusBarAlignment.Left,
            );
            this._statusBarItem.command = 'clickup.stopTimer';
            this._statusBarItem.tooltip = `Stop Timer for [${taskId}] ${this.task.name}`;
            this._statusBarItem.show();
        }
        if (!this._statusBarStartButton) {
            this._statusBarStartButton = window.createStatusBarItem(
                StatusBarAlignment.Left,
            );
            this._statusBarStartButton.text = `$(play-circle) ${totalTime}`;
            this._statusBarStartButton.command = 'clickup.startTimer';
            this._statusBarStartButton.tooltip = `Start Timer for [${taskId}] ${this.task.name}`;
        }

        this._statusBarStartButton.show();
    }

    /**
     *
     *
     * @private
     * @param {*} [from=Date.now()]
     * @memberof Timer
     */
    private startCount(from = Date.now()) {
        this.startDate = from;

        if (this.startDate === undefined) {
            return;
        }

        this._statusBarItem.show();
        this._statusBarItem.backgroundColor = new ThemeColor(
            'statusBarItem.errorBackground',
        );
        this._statusBarStartButton.hide();

        this._timer = setInterval(() => {
            this.startDate++;
            const durationFormatted = getFormattedDurationBetween(
                this.startDate,
            );
            this._statusBarItem.text = `$(stop-circle) ${durationFormatted}`;
        }, 100);
    }
    /**
     *
     *
     * @memberof Timer
     */
    public async start() {
        const data: CreateTime = {
            billable: false,
            tid: this.task.id,
            fromTimesheet: false,
            start: Date.now(),
            duration: -1,
        };
        this.apiWrapper
            .startTime(this.task.team_id, data)
            .then(() => {
                this.startCount();
                if (this.startCallback) {
                    this.startCallback();
                }
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.log(`start time error: ${error}`);
            });
    }

    /**
     *
     *
     * @memberof Timer
     */
    public stop() {
        this.apiWrapper
            .stopTime(this.task.team_id)
            .then(() => {
                this._statusBarItem.hide();
                this._statusBarStartButton.show();
                this._statusBarItem.text = DEFAULT_TIME;
                clearInterval(this._timer);
                if (this.stopCallback) {
                    this.stopCallback();
                }
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.log(`stop time error: ${error}`);
            });
    }

    /**
     *
     *
     * @param {*} [time=DEFAULT_TIME]
     * @memberof Timer
     */
    public showTimer(time = DEFAULT_TIME) {
        this._statusBarItem.text = time;
        this._statusBarItem.show();
    }

    /**
     *
     *
     * @param {number} startFrom
     * @param {boolean} [andStart=false]
     * @memberof Timer
     */
    public restore(startFrom: number) {
        const durationFormatted = getFormattedDurationBetween(startFrom);
        this.showTimer(durationFormatted);
        this.startCount(startFrom);
    }

    /**
     *
     *
     * @memberof Timer
     */
    public destroy() {
        this._statusBarItem.dispose();
        this._statusBarStartButton.dispose();
    }
}

/**
 *
 *
 * @private
 * @param {number} unixtime
 * @return {*}
 * @memberof TimesListProvider
 */
export function unixtimeToString(unixtime: number) {
    const date = unixtimeToDate(unixtime);
    return date.toLocaleString(env.language);
}

/**
 *
 *
 * @export
 * @param {number} unixtime
 * @return {*}
 */
export function unixtimeToDate(unixtime: number) {
    return new Date(unixtime * 1);
}

/**
 *
 *
 * @param {number} from
 * @param {number} to
 * @return {*}
 */
export function getFormattedDurationBetween(
    from: number,
    to: number = Date.now(),
) {
    const millisecDurationToNow = dayjs(to).diff(dayjs(from));
    return formatDurationWatch(millisecDurationToNow);
}

/**
 * Format a duration in milliseconds to a human-readable string.
 *
 * The formatted string will be in the format "HH:mm:ss".
 *
 * @param inputDuration - The duration in milliseconds.
 * @returns The formatted string.
 */
export function formatDurationWatch(inputDuration: number): string {
    const duration = dayjs.duration(inputDuration);

    if (!dayjs.isDuration(duration)) {
        return DEFAULT_TIME;
    }
    return duration.format(FORMAT_TIME);
}

/**
 * Format a duration in milliseconds as a human-readable string.
 *
 * The formatted string will be in the format "Xd Yh Zm", where X is the number of days, Y is the number of hours, Z is the number of minutes.
 *
 * If the duration is less than 1 day, the string will be in the format "Yh Zm".
 *
 * If the duration is less than 1 hour, the string will be in the format "Zm".
 *
 * If the duration is less than 1 minute, the string will be in the format "Ws".
 *
 * @param inputDuration - The duration in milliseconds to format.
 * @return The formatted duration string.
 */
export function formatDuration(inputDuration: number) {
    const totalDuration = dayjs.duration(inputDuration);

    const days = Math.floor(totalDuration.asDays());
    const hours = totalDuration.hours();
    const minutes = totalDuration.minutes();
    const seconds = totalDuration.seconds();

    if (days >= 1) {
        return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours >= 1) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes >= 1) {
        return `${minutes}m`;
    }

    return `${seconds}s`;
}

/**
 * Format the total time tracked by a list of Tracking objects.
 *
 * It adds up all the time tracked in all the intervals of all the Tracking objects.
 *
 * @param {Tracking[]} trackingList - The list of Tracking objects from which to gather the total time tracked.
 * @return {string} - The total time tracked, formatted as a duration string.
 */
export function formatTrackingDuration(trackingList: Tracking[]): string {
    const totalDuration = trackingList.reduce((totalSum, tracking) => {
        const trackingDuration = tracking.intervals.reduce((sum, interval) => {
            return sum + parseInt(interval.time, 10);
        }, 0);
        return totalSum + trackingDuration;
    }, 0);

    return formatDuration(totalDuration);
}

/**
 * Format a ClickUp interval object into a human-readable string.
 *
 * The formatted string will be in the format "Xh Ym Zs on MMM D", where
 * X is the number of hours, Y is the number of minutes, Z is the number of
 * seconds, and MMM D is the day of the month (e.g. "Jan 1").
 *
 * @param {Interval} interval - The ClickUp interval object to format.
 * @return {string} - The formatted string.
 */
export function formatInterval(interval: Interval): string {
    const startDate = dayjs(parseInt(interval.start, 10));
    const endDate = dayjs(parseInt(interval.end, 10));
    const duration = endDate.diff(startDate);

    const formattedDuration = formatDuration(duration);

    return `${formattedDuration} on ${startDate.format('MMM D')}`;
}
