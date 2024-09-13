import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Task, Checklist, Priority, Status, Tag } from '../types';
import { formatDueDate } from '../constants';

export class OpenTaskPanel {
    tempFilePath: string;

    constructor(task: Task) {
        this.tempFilePath = path.join(os.tmpdir(), task.name.replace(/\//g, '-'));
        const taskContent = this.createMarkdownContent(task);
        console.log(task);
        fs.writeFile(this.tempFilePath, taskContent, err => {
            if (err) {
                vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
                return;
            }
        });
        this.openTaskMarkdownFile();
    }

    private createMarkdownContent(task: Task): string {
        const dueDate = formatDueDate(task.due_date);
        let dueDateStatus = '';
        if (dueDate[1] === 'Today') {
            dueDateStatus = `- <span style="color:#FFA500;">Today</span>`;
        } else if (dueDate[1] === 'Overdue') {
            dueDateStatus = `- <span style="color:#FF0000;">Overdue</span>`;
        }
        let taskContent = `# ${task.name}\n\n`;
        taskContent += `**Due date**: ${task.due_date ? dueDate[0] : 'Not specified'} ${dueDateStatus}\n\n`;
        taskContent += this.showPriority(task.priority);
        taskContent += this.showStatus(task.status);
        taskContent += this.showTags(task.tags);
        taskContent += `## Description\n${task.markdown_description}\n\n`;
        taskContent += `---\n\n`;
        taskContent += this.showChecklists(task.checklists);
        taskContent += this.showCreatorInfo(task.creator);
        taskContent += `\n\n[View Task Online](${task.url})`;

        return taskContent;
    }

    private showPriority(priority: Priority | null): string {
        if (!priority) {
            return '';
        }
        return `- **Priority**: <span style="color:${priority.color}">${priority.priority.toUpperCase()}</span>\n`;
    }

    private showStatus(status: Status): string {
        return `- **Status**: <span style="color:${status.color}">${status.status.toUpperCase()}</span>\n`;
    }

    private showTags(tags?: Tag[]): string {
        if (!tags || tags.length === 0) {
            return '';
        }
        let tagsContent = '- **Tags**:\n';
        tags.forEach((tag) => {
            tagsContent += `<span style="background-color:${tag.tag_bg};padding:3px 5px;margin: 0 2px; border-radius: 3px;">`;
            tagsContent += `${tag.name}</span>\n`;
        });
        return tagsContent;
    }

    private showChecklists(checklists: Checklist[]): string {
        let checklistContent = ``;
        if (checklists.length > 0) {
            checklistContent += `## Checklists\n`;
            checklists.forEach((checklist: Checklist) => {
                checklistContent += `### ${checklist.name}\n`;
                checklist.items.forEach((item) => {
                    checklistContent += `- [${item.resolved ? 'X' : ' '}] ${item.name}\n`;
                });
                checklistContent += `\n`;
            });
        }
        return checklistContent;
    }

    private showCreatorInfo(creator: { username: string; email: string; profilePicture: string }): string {
        let creatorContent = `### Creator Information\n`;
        creatorContent += `<img src="${creator.profilePicture}" width="100" />\n\n`;
        creatorContent += `- **Username**: ${creator.username}\n`;
        creatorContent += `- **Email**: ${creator.email}\n`;
        return creatorContent;
    }

    /**
     * Open markdown file in vscode
     * @private
     * @returns {Promise<void>}
     * @memberof OpenTaskPanel
     */
    private async openTaskMarkdownFile(): Promise<void> {
        const doc = await vscode.workspace.openTextDocument(this.tempFilePath);
        // await vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
        await vscode.commands.executeCommand('markdown.showPreview', doc.uri);
    }
}

