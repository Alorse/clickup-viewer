import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Task } from '../types';

export class OpenTaskPanel {
    tempFilePath: string;

    constructor(task: Task) {
        this.tempFilePath = path.join(os.tmpdir(), task.name);
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
        const creator = task.creator;
        let creatorInfo = ``;
        creatorInfo += `### Creator Information\n`;
        creatorInfo += `![Profile Picture](${creator.profilePicture})\n`;
        creatorInfo += `- **Username**: ${creator.username}\n`;
        creatorInfo += `- **Email**: ${creator.email}`;

        let taskContent = `# ${task.name}\n\n`;
        taskContent += `**Due date**: ${task.due_date ? task.due_date : 'Not specified'}\n\n`;
        taskContent += `## Description\n${task.markdown_description}\n\n`;
        taskContent += `---\n\n`;
        taskContent += `${creatorInfo}\n\n`;
        taskContent += `[View Task Online](${task.url})`;

        return taskContent;
    }

    private async openTaskMarkdownFile(): Promise<void> {
        const doc = await vscode.workspace.openTextDocument(this.tempFilePath);
        // await vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
        await vscode.commands.executeCommand('markdown.showPreview', doc.uri);
    }
}
