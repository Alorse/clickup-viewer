import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Folder } from '../../types';
import { getRandomHexColor } from '../../constants';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class FolderItem extends TreeItem {
    constructor(
        public folder: Folder,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        super(folder.name, collapsibleState);
        this.id = folder.id;
        this.iconPath = {
            light: this.getIconPath(folder.name),
            dark: this.getIconPath(folder.name),
        };
    }
    contextValue = 'folderItem';

    private getIconPath(folderName: string): string {
        const iconColor = getRandomHexColor();
        const svgIcon = `
            <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.3" d="M3 9.312C3 4.93757 3.93757 4 8.312 4H9.92963C10.5983 4 11.2228 4.3342 11.5937 4.8906L12.4063 6.1094C12.7772 6.6658 13.4017 7 14.0704 7C15.9647 7 17.8145 7 19.1258 7C20.1807 7 21.0128 7.82095 21.0029 8.8758C21.0013 9.05376 21 9.20638 21 9.312V14.688C21 19.0624 20.0624 20 15.688 20H8.312C3.93757 20 3 19.0624 3 14.688V9.312Z" fill="${iconColor}"/>
                <path d="M3 9.312C3 4.93757 3.93757 4 8.312 4H9.92963C10.5983 4 11.2228 4.3342 11.5937 4.8906L12.4063 6.1094C12.7772 6.6658 13.4017 7 14.0704 7C15.9647 7 17.8145 7 19.1258 7C20.1807 7 21.0128 7.82095 21.0029 8.8758C21.0013 9.05376 21 9.20638 21 9.312V14.688C21 19.0624 20.0624 20 15.688 20H8.312C3.93757 20 3 19.0624 3 14.688V9.312Z" stroke="${iconColor}" stroke-width="2"/>
            </svg>
        `;
        const nameSlug = folderName.toLowerCase().replace(/[ /]/g, '-');
        const tempIconPath = path.join(os.tmpdir(), `folder-${nameSlug}.svg`);
        fs.writeFileSync(tempIconPath, svgIcon);
        return tempIconPath;
    }
}
