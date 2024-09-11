import path = require('path');
import * as vscode from 'vscode';
import * as types from '../../types';
import * as fs from 'fs';
import * as os from 'os';

export class TaskItem extends vscode.TreeItem {

    constructor(
        public task: types.Task,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ) {
        super(task.name, collapsibleState);

        var dueDate = this.formatDueDate(task.due_date ? task.due_date : 'N/A');
        var taskName = `${task.parent ?  '└' : ''} ${dueDate[1] ? `🟠` : ''} ${task.name}`;
        this.label = taskName;

        const tooltip = new vscode.MarkdownString('', true);
        tooltip.supportHtml = true;
        tooltip.isTrusted = true;
        tooltip.appendMarkdown(`<h3>${task.name}</h3>
<p>
<strong>ID:</strong> ${task.custom_id}<br>
<strong>Status:</strong> ${task.status.status.toUpperCase()}<br>
<strong>Due Date:</strong> ${dueDate[0]} - ${dueDate[1] ? (dueDate[1] === 'Today' ? `<span style="color:#FFA500;">Today</span>` : dueDate[1] === 'Overdue' ? `<span style="color:#FF0000;">Overdue</span>` : dueDate[1]) : ''}<br>
<strong>Space:</strong> ${task.folder.name} / ${task.list.name}<br>
</p>
<p>
<a href="${task.url}">Open in ClickUp</a>
</p>`);
        this.tooltip = tooltip;
            
        var iconName = 'box-full-item.svg';
        const iconColor = task.status.color;

        this.iconPath = {
          light: this.getIconPath(iconName, iconColor),
          dark: this.getIconPath(iconName, iconColor)
        };
    }

    contextValue = 'taskItem';

    private getIconPath(iconName: string, iconColor: string): string {
        const iconPath = path.join(__filename, '..', '..', '..', '..', 'resources', 'taskItem', iconName);
        const svgContent = fs.readFileSync(iconPath, 'utf8');
        const svgWithColor = svgContent.replace(/fill="#000000"/g, `fill="${iconColor}"`);
        const tempIconPath = path.join(os.tmpdir(), `icon-${iconColor}.svg`);
        fs.writeFileSync(tempIconPath, svgWithColor);
        return tempIconPath;
    }

    private formatDueDate(dueDate: string): [string, string | boolean] {
        if (dueDate === null) {
            return ['N/A', false];
        }
        const date = new Date(Number.parseInt(dueDate));
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isOverdue = date.getTime() < today.getTime();
        const dueDateString = date.toLocaleDateString();
        return [dueDateString, isToday ? 'Today' : isOverdue ? 'Overdue' : false];
    }
}