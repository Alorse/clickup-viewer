import path = require('path');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Team } from '../../types';
import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';

export class TeamItem extends TreeItem {
    constructor(
        public id: string,
        public readonly team: Team,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(team.name, collapsibleState);

        if (team.avatar) {
            this.downloadAvatar(team.avatar, id).then((iconPath) => {
                this.iconPath = {
                  light: iconPath,
                  dark: iconPath
                };
              });
        } else {
            this.iconPath = {
                light: this.getIconPath(team.color, team.name),
                dark: this.getIconPath(team.color, team.name),
            };
        }
    }
    contextValue = 'teamItem';

    private getIconPath(iconColor: string, teamName: string): string {
        const initial = teamName.charAt(0).toUpperCase();
        const svgIcon = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="16" height="16" fill="${iconColor}" rx="2"/>
                <text x="8" y="12" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">${initial}</text>
            </svg>
        `;
        const tempIconPath = path.join(os.tmpdir(), `icon-${iconColor}.svg`);
        fs.writeFileSync(tempIconPath, svgIcon);
        return tempIconPath;
    }
    private async downloadAvatar(avatarUrl: string, teamId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const filePath = path.join(os.tmpdir(), `avatar-${teamId}.png`);
            const file = fs.createWriteStream(filePath);
            const request = https.get(avatarUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filePath);
                });
            }).on('error', (err) => {
                fs.unlink(filePath, (err) => {
                    reject(err);
                });
            });
            request.end();
        });
    };
}