import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { Time } from '../../types';
import { unixtimeToString, formatTimeDuration } from '../../lib/Timer';

export class TimeItem extends TreeItem {
    constructor(
        public TimeItem: Time,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        const start = unixtimeToString(Number.parseInt(TimeItem.start));
        const end = TimeItem.end ? unixtimeToString(Number.parseInt(TimeItem.end)) : 'undefined';

        super(TimeItem.description, collapsibleState);
        this.id = `${TimeItem.id}`;
        this.label = `${TimeItem.task.name} : ${formatTimeDuration(parseInt(TimeItem.duration, 10))}`;
        this.tooltip = `${start} - ${end}`;
        this.iconPath = new ThemeIcon('watch');
    }
    contextValue = 'trackingItem';
}
