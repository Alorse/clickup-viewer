import path = require('path');
import * as vscode from 'vscode';
import { Task } from '../../types';
import { formatDueDate, OVERDUE, TODAY } from '../../constants';
import * as fs from 'fs';
import * as os from 'os';

export class TaskItem extends vscode.TreeItem {

    constructor(
        public task: Task,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ) {
        super(task.name, collapsibleState);

        var dueDate = formatDueDate(task.due_date);
        var taskName = `${task.parent ? '└ ' : ''}${task.name}`;
        this.label = taskName;

        let tooltipContent = ``;
        tooltipContent += `<h3>${task.name}</h3>`;
        tooltipContent += `<p><strong>ID:</strong> ${task.custom_id ? task.custom_id : task.id}<br>`;
        tooltipContent += `<strong>Status:</strong> ${task.status.status.toUpperCase()}<br>`;
        let dueDateStatus = '';
        if (dueDate[1] === TODAY) {
            dueDateStatus = `- <span style="color:#FFA500;">Today</span>`;
        } else if (dueDate[1] === OVERDUE) {
            dueDateStatus = `- <span style="color:#FF0000;">Overdue</span>`;
        }
        tooltipContent += `<strong>Due Date:</strong> ${task.due_date ? dueDate[0] : 'N/A'} ${dueDateStatus}<br>`;
        tooltipContent += `<strong>Space:</strong> ${task.folder.name} / ${task.list.name}<br></p>`;
        tooltipContent += `<p><a href="${task.url}">Open in ClickUp</a></p>`;

        const tooltip = new vscode.MarkdownString(tooltipContent, true);
        tooltip.supportHtml = true;
        tooltip.isTrusted = true;
        this.tooltip = tooltip;

        const iconColor = task.status.color;

        this.iconPath = {
            light: this.getIconPath(task.id, iconColor),
            dark: this.getIconPath(task.id, iconColor)
        };

        this.resourceUri = this.createViewDecorationUri(task.id, dueDate[1]);

        this.command = {
            command: 'clickup.openTask',
            title: 'Open Task',
            arguments: [task]
        };
    }

    contextValue = 'taskItem';

    private getIconPath(taskId: string, iconColor: string): string {
        const svgIcon = `
            <svg fill="${iconColor}" width="32px" height="32px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" >
                <path d="M96 448Q82 448 73 439 64 430 64 416L64 96Q64 82 73 73 82 64 96 64L416 64Q430 64 439 73 448 82 448 96L448 416Q448 430 439 439 430 448 416 448L96 448Z" />
            </svg>
        `;
        const tempIconPath = path.join(os.tmpdir(), `task-${taskId}.svg`);
        fs.writeFileSync(tempIconPath, svgIcon);
        return tempIconPath;
    }

    /**
     * Creates a URI with a special scheme that can be used to trigger a special
     * decoration in the tree view.
     *
     * @param taskId the ID of the task
     * @param overdue whether the task is overdue, is today, or is neither
     * @return a URI that can be used to trigger a decoration
     */
    private createViewDecorationUri(taskId: string, overdue?: string | boolean): vscode.Uri {
        const scheme = 'clickup-viewer';
        const uriString = `${scheme}://${taskId}`;
        const uriQuery: { [key: string]: string } = {};
        if (overdue) {
            uriQuery.color = overdue === OVERDUE ? 'clickup.taskItemLabelOverdue' : 'clickup.taskItemLabelExpiresToday';
        }
        const uriObject = {
            scheme: scheme,
            authority: '',
            path: taskId,
            query: new URLSearchParams(uriQuery).toString(),
            fragment: ''
        };
        return vscode.Uri.parse(`${uriString}?${uriObject.query}`);
    }
}