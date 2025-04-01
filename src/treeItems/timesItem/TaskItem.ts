import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { Time } from '../../types';
import { unixtimeToString, formatTimeDuration } from '../../lib/Timer';

/**
 * Creates an instance of TaskItem.
 * 
 * @param {Time} TimeItem - The time item associated with the task.
 * @param {TreeItemCollapsibleState} collapsibleState - The collapsible state of the tree item.
 */
export class TaskItem extends TreeItem {
    constructor(
        public TimeItem: Time,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        const start = unixtimeToString(Number.parseInt(TimeItem.start));
        const end = TimeItem.end
            ? unixtimeToString(Number.parseInt(TimeItem.end))
            : 'undefined';

        super(TimeItem.description, collapsibleState);
        this.id = `${TimeItem.id}`;
        this.label = `${formatTimeDuration(parseInt(TimeItem.duration, 10) / 1000)} : ${TimeItem.task.name}`;
        this.tooltip = `${TimeItem.task.custom_id ?? TimeItem.task.id} : ${TimeItem.task.name} : ${start} - ${end}`;
        this.iconPath = new ThemeIcon('watch');
    }
    contextValue = 'trackingItem';
}
