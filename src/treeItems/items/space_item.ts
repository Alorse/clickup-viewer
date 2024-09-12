import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Space } from '../../types';
import { getIconPath } from '../../constants';

export class SpaceItem extends TreeItem {
    constructor(
        public space: Space,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(space.name, collapsibleState);
        this.id = space.id;
        this.iconPath = {
            light: getIconPath(space.color, space.name),
            dark: getIconPath(space.color, space.name)
        };
    }
    contextValue = 'spaceItem';
}