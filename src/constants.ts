import * as fs from 'fs';
import * as os from 'os';
import path = require('path');
// extension.ts
export const DEFAULT_TASK_DETAILS = [
    'id', 'name', 'description', 'url', 'status', 'priority', 'creator', 'tags', 'assignees'
];

export const OVERDUE = 'overdue';
export const TODAY = 'today';

export const getRandomHexColor = (): string => {
    let n = (Math.random() * 0xfffff * 1000000).toString(16);
    return "#" + n.slice(0, 6);
};

export const getIconPath = (iconColor: string | null, itemName: string): string => {
    const initial = itemName.charAt(0).toUpperCase();
    const svgIcon = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="16" height="16" fill="${iconColor ? iconColor : getRandomHexColor()}" rx="2"/>
            <text x="8" y="12" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">${initial}</text>
        </svg>
    `;
    const nameSlug = itemName.toLowerCase().replace(/[ \/]/g, '-');
    const tempIconPath = path.join(os.tmpdir(), `ico-${nameSlug}.svg`);
    fs.writeFileSync(tempIconPath, svgIcon);
    return tempIconPath;
};

export const formatDueDate =(dueDate: string | null): [string, string | boolean] => {
    if (dueDate === null) {
        return ['N/A', false];
    }
    const date = new Date(Number.parseInt(dueDate));
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isOverdue = date.getTime() < today.getTime();
    const dueDateString = date.toLocaleDateString();
    return [dueDateString, isToday ? TODAY : isOverdue ? OVERDUE : false];
};

