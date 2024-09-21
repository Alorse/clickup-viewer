import {
	StatusBarItem,
	window,
	env,
	StatusBarAlignment,
	ThemeColor
} from "vscode";
import { ApiWrapper } from "./apiWrapper";
import { CreateTime, Task, Interval, Tracking } from "../types";

const DEFAULT_TIME = "00:00:00";
const FORMAT_TIME = "HH:mm:ss";

const dayjs = require("dayjs");
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

export default class Timer {
	private _statusBarItem!: StatusBarItem;
	private _statusBarStartButton!: StatusBarItem;
	private _statusBarPauseButton!: StatusBarItem;

	private _timer!: NodeJS.Timeout;
	private startDate: number;

	private task: Task;
	private apiWrapper: ApiWrapper;

	private startCallback?: CallableFunction;
	private stopCallback?: CallableFunction;

	constructor(task: Task, apiWrapper: ApiWrapper, startCallback?: CallableFunction, stopCallback?: CallableFunction) {
		this.task = task;
		this.apiWrapper = apiWrapper;
		this.startDate = 0;

		this.startCallback = startCallback;
		this.stopCallback = stopCallback;
		const taskId = task.custom_id ? task.custom_id : task.id;

		// create status bar items
		if (!this._statusBarItem) {
			this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
			this._statusBarItem.command = "clickup.stopTimer";
			this._statusBarItem.tooltip = `Pause Timer for [${taskId}] ${this.task.name}`;
			this._statusBarItem.show();
		}
		if (!this._statusBarStartButton) {
			this._statusBarStartButton = window.createStatusBarItem(
				StatusBarAlignment.Left
			);
			this._statusBarStartButton.text = "$(triangle-right)";
			this._statusBarStartButton.command = "clickup.startTimer";
			this._statusBarStartButton.tooltip = `Start Timer for [${taskId}] ${this.task.name}`;
		}
		if (!this._statusBarPauseButton) {
			this._statusBarPauseButton = window.createStatusBarItem(
				StatusBarAlignment.Left
			);
			this._statusBarPauseButton.text = "$(debug-pause)";
			this._statusBarPauseButton.command = "clickup.stopTimer";
			this._statusBarPauseButton.tooltip = `Pause Timer for [${taskId}] ${this.task.name}`;
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
		this._statusBarItem.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
		this._statusBarStartButton.hide();
		// this._statusBarPauseButton.show();

		this._timer = setInterval(() => {
			this.startDate++;
			const durationFormatted = getFormattedDurationBetween(this.startDate);
			this._statusBarItem.text = durationFormatted;
		}, 1000);
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
		this.apiWrapper.startTime(this.task.team_id, data)
			.then((response) => {
				this.startCount();
				if (this.startCallback) {
					this.startCallback();
				}
			}).catch((error) => {
				console.log(`start time error: ${error}`);
			});
	}

	/**
	 *
	 *
	 * @memberof Timer
	 */
	public stop() {
		this.apiWrapper.stopTime(this.task.team_id)
			.then((response) => {
				this._statusBarItem.hide();
				this._statusBarStartButton.show();
				this._statusBarPauseButton.hide();
				this._statusBarItem.text = DEFAULT_TIME;
				clearInterval(this._timer);
				if (this.stopCallback) {
					this.stopCallback();
				}
			}).catch((error) => {
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
		this._statusBarPauseButton.dispose();
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
export function getFormattedDurationBetween(from: number, to: number = Date.now()) {
	const millisecDurationToNow = dayjs(to).diff(dayjs(from));
	return formatDuration(millisecDurationToNow);
}

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

export function formatTrackingDuration(trackingList: Tracking[]): string {
    // Sumar los tiempos de todos los intervalos de todos los Tracking
    const totalDuration = trackingList.reduce((totalSum, tracking) => {
        // Sumar los tiempos de los intervalos de cada Tracking
        const trackingDuration = tracking.intervals.reduce((sum, interval) => {
            return sum + parseInt(interval.time, 10); // Convertimos a número y sumamos
        }, 0);
        return totalSum + trackingDuration; // Sumamos al total general
    }, 0);

    return formatDuration(totalDuration); // Reutilizamos la función formatDuration
}


export function formatInterval(interval: Interval): string {
    const startDate = dayjs(parseInt(interval.start, 10));
    const endDate = dayjs(parseInt(interval.end, 10));
    const duration = endDate.diff(startDate);

    const formattedDuration = formatDuration(duration);

    return `${formattedDuration} on ${startDate.format('MMM D')}`;
}