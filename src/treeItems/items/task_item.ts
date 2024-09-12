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
        var taskName = `${task.parent ?  '└ ' : ''}${dueDate[1] ? `🟠 ` : ''}${task.name}`;
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

        const iconColor = task.status.color;

        this.iconPath = {
          light: this.getIconPath(taskName, iconColor),
          dark: this.getIconPath(taskName, iconColor)
        };

        this.command = {
            command: 'clickup.openTask',
            title: 'Open Task',
            arguments: [task]
        };
    }

    contextValue = 'taskItem';

    private getIconPath(taskName: string, iconColor: string): string {
        const svgIcon = `
            <svg fill="${iconColor}" width="32px" height="32px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" >
                <path d="M96 448Q82 448 73 439 64 430 64 416L64 96Q64 82 73 73 82 64 96 64L416 64Q430 64 439 73 448 82 448 96L448 416Q448 430 439 439 430 448 416 448L96 448Z" />
            </svg>
        `;
        const nameSlug = taskName.toLowerCase().replace(/[ \/]/g, '-');
        const tempIconPath = path.join(os.tmpdir(), `folder-${nameSlug}.svg`);
        fs.writeFileSync(tempIconPath, svgIcon);
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