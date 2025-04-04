import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { SameTaskTime } from '../../types';
import { unixtimeToString, formatTimeDuration } from '../../lib/Timer';

/**
 * Creates an instance of TaskItem.
 *
 * @param {SameTaskTime} TimeItem - The time item associated with the task.
 * @param {TreeItemCollapsibleState} collapsibleState - The collapsible state of the tree item.
 */
export class TaskItem extends TreeItem {
    constructor(
        public TimeItem: SameTaskTime,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        const totalDuration = TimeItem.duration.reduce(
            (acc, duration) => acc + parseInt(duration, 10),
            0,
        );
        const startTimes = TimeItem.start.map((start) =>
            unixtimeToString(Number.parseInt(start)),
        );
        const endTimes = (TimeItem.end ?? []).map((end) =>
            unixtimeToString(Number.parseInt(end)),
        );

        super(TimeItem.task.name, collapsibleState);
        this.id = `${TimeItem.task.id}`;
        this.label = `${formatTimeDuration(totalDuration / 1000)} : ${TimeItem.task.name}`;
        this.tooltip =
            `Task: ${TimeItem.task.custom_id ?? TimeItem.task.id} : ${TimeItem.task.name}\n` +
            TimeItem.start
                .map(
                    (_, index) =>
                        `Report ${index + 1}: ${startTimes[index]} - ${endTimes[index] ?? 'undefined'} (${formatTimeDuration(parseInt(TimeItem.duration[index], 10) / 1000)})`,
                )
                .join('\n');
        this.iconPath = new ThemeIcon('watch');
    }
    contextValue = 'trackingItem';
}
