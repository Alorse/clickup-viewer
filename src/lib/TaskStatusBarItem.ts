import * as vscode from 'vscode';
import { Task } from '../types';

export class TaskStatusBarItem {
    public taskItem;

    constructor() {
        this.taskItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
        );
        this.taskItem.show();
    }

    setCommand(command: string, props: Task) {
        this.taskItem.command = {
            title: '',
            command: command,
            arguments: [props],
        };
    }

    setText(text: string) {
        this.taskItem.text = text;
    }
    setTooltip(text: string) {
        this.taskItem.tooltip = text;
    }

    setDefaults() {
        this.taskItem.hide();
    }
}
