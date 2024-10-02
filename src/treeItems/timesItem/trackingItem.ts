
import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { Tracking } from '../../types';
import { formatDuration } from '../../lib/Timer';

export class TrackingItem extends TreeItem {
    constructor(
        public trackingItem: Tracking,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        const title = `${trackingItem.user.username} (${formatDuration(trackingItem.time)})`;
        super(title, collapsibleState);
        this.id = `${trackingItem.time}`;
        this.iconPath = new ThemeIcon('person');
    }
    contextValue = 'trackingItem';
}