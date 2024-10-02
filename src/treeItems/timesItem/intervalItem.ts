import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { Interval } from '../../types';
import { unixtimeToString, formatInterval } from '../../lib/Timer';

export class IntervalItem extends TreeItem {
    constructor(
        public intervalItem: Interval,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        const start = unixtimeToString(Number.parseInt(intervalItem.start));
        const end = unixtimeToString(Number.parseInt(intervalItem.end));

        super(intervalItem.description, collapsibleState);
        this.id = `${intervalItem.id}`;
        this.label = formatInterval(intervalItem);
        this.tooltip = `${start} - ${end}`;
        this.iconPath = new ThemeIcon('watch');
    }
    contextValue = 'trackingItem';
}