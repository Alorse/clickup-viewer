import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Task, Checklist, Priority, Status, Tag, Creator, CustomField, Space, Folder, List } from '../types';
import { formatDueDate, TODAY, OVERDUE, CLICKUP_URL } from '../constants';
import { LocalStorageController } from '../controllers/LocalStorageController';

export const USER_CUSTOM_FIELD_NAME = "Stakeholder";

export class OpenTaskPanel {
    tempFilePath: string;
    storageManager: LocalStorageController;

    constructor(task: Task, storageManager: LocalStorageController) {
        this.tempFilePath = path.join(os.tmpdir(), task.id);
        this.storageManager = storageManager;
        this.createMarkdownContent(task).then((taskContent) => {
            fs.writeFile(this.tempFilePath, taskContent, err => {
                if (err) {
                    vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
                    return;
                }
                this.openTaskMarkdownFile();
            });
        }).catch((err) => {
            vscode.window.showErrorMessage(`Error creating markdown content: ${err}`);
        });
    }

    private async createMarkdownContent(task: Task): Promise<string> {
        let taskContent = ``;
        taskContent += await this.showBreadcrumb(task.space, task.folder, task.list, task.team_id);
        taskContent += `# [[${task.custom_id ? task.custom_id : task.id}]](${task.url}) ${task.name}\n\n`;
        taskContent += this.showParent(task.parent);
        taskContent += this.showStatus(task.status);
        taskContent += this.showDates(task.due_date);
        taskContent += this.showTags(task.tags);
        taskContent += this.showPriority(task.priority);
        taskContent += `## Description\n${task.markdown_description}\n\n`;
        taskContent += this.showChecklists(task.checklists);
        taskContent += `---\n\n`;
        const customUser = this.getCustomUser(task, USER_CUSTOM_FIELD_NAME);
        if (customUser) {
            const customUserObject = customUser as { name: string; creator: Creator; };
            taskContent += this.showUserInfo(customUserObject.name, customUserObject.creator);
        } else {
            taskContent += this.showUserInfo("Created by", task.creator);
        }
        taskContent += `\n\n\n[Open in ClickUp](${task.url})`;
    
        return taskContent;
    }

    private showParent(parent: string | null): string {
        if (!parent) {
            return '';
        }
        return `**Parent**: [[${parent}]](${CLICKUP_URL}/t/${parent})\n\n`;
    }
    private async showBreadcrumb(space: Space, folder: Folder, list: List, teamId: string): Promise<string> {
        const storedSpaces: Space[] = await this.storageManager.getValue(`space-${teamId}`);
        const folderHidden = folder.hidden;
        const foundSpaceName = storedSpaces?.find((s: Space) => s.id === space.id)?.name;

        return `*${foundSpaceName ? `${foundSpaceName} / ` : ''}${folderHidden ? '' : `${folder.name} / `}${list.name}*\n\n`;
    }

    private showDates(date: string | null): string {
        const dueDate = formatDueDate(date);
        let dueDateStatus = '';
        if (dueDate[1] === TODAY) {
            dueDateStatus = `- <span style="color:var(--vscode-clickup-taskItemLabelExpiresToday)">Today</span>`;
        } else if (dueDate[1] === OVERDUE) {
            dueDateStatus = `- <span style="color:var(--vscode-clickup-taskItemLabelOverdue)">Overdue</span>`;
        }
        return `- **Due date**: ${dueDate ? dueDate[0] : 'Not specified'} ${dueDateStatus}\n\n`;
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

    /**
     * Returns a string containing a markdown formatted representation of a user's details.
     * The returned string will include the user's profile picture, username and email.
     * @param title the title to display above the user's information
     * @param creator the user to display information for
     * @returns a string containing a markdown formatted representation of a user's details
     */
    private showUserInfo(title: string, creator: Creator): string {
        let creatorContent = `### ${title}\n`;
        if (creator.profilePicture) {
            creatorContent += `<img src="${creator.profilePicture}" width="100" />\n\n`;
        }
        creatorContent += `- **Username**: ${creator.username}\n`;
        creatorContent += `- **Email**: ${creator.email}\n`;
        return creatorContent;
    }

    /**
     * Returns the custom field value and its associated creator for a given custom field name if it exists, otherwise false.
     * @param task the task to search custom fields in
     * @param customFieldName the name of the custom field to search
     * @returns an object with name and creator properties or false
     */
    private getCustomUser(task: Task, customFieldName: string): { name: string, creator: Creator } | boolean {
        const customField: CustomField | undefined = task.custom_fields.find(cf => cf.name === customFieldName);
        if (customField && customField.value && customField.value.length > 0) {
            return {
                name: customField.name,
                creator: customField.value[0]
            };
        }
        return false;
    }

    /**
     * Open markdown file in vscode
     * @private
     * @returns {Promise<void>}
     * @memberof OpenTaskPanel
     */
    private async openTaskMarkdownFile(): Promise<void> {
        const doc = await vscode.workspace.openTextDocument(this.tempFilePath);
        setTimeout( async() => await vscode.commands.executeCommand('markdown.showPreview', doc.uri), 100);
    }
}


