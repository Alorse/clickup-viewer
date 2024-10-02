import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { List } from '../../types';
import { getRandomHexColor } from '../../constants';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class ListItem extends TreeItem {
    constructor(
        public list: List,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public taskCounter?: number,
    ) {
        if (taskCounter === undefined) {
            taskCounter = 0;
        }
        super(list.name + ` (${taskCounter})`, collapsibleState);
        this.id = list.id;
        this.iconPath = {
            light: this.getIconPath(list.name),
            dark: this.getIconPath(list.name)
        };
    }
    contextValue = 'listItem';

    private getIconPath(listName: string): string {
        const iconColor = getRandomHexColor();
        const svgIcon = `
            <svg width="32px" height="32px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6.00067L21 6.00139M8 12.0007L21 12.0015M8 18.0007L21 18.0015M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51M4 6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5C3.77614 5.5 4 5.72386 4 6ZM4 12C4 12.2761 3.77614 12.5 3.5 12.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5C3.77614 11.5 4 11.7239 4 12ZM4 18C4 18.2761 3.77614 18.5 3.5 18.5C3.22386 18.5 3 18.2761 3 18C3 17.7239 3.22386 17.5 3.5 17.5C3.77614 17.5 4 17.7239 4 18Z" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        const nameSlug = listName.toLowerCase().replace(/[ /]/g, '-');
        const tempIconPath = path.join(os.tmpdir(), `folder-${nameSlug}.svg`);
        fs.writeFileSync(tempIconPath, svgIcon);
        return tempIconPath;
    }
}