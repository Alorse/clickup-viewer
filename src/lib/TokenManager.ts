import * as vscode from 'vscode';

interface L10n {
    t: (key: string) => string;
}

export default class TokenManager {
    token?: string = undefined;
    regex = /^[a-z]{2}[_]\d+[_].{32}/g;
    l10n: L10n;
    config: vscode.WorkspaceConfiguration;

    constructor(l10n: L10n) {
        this.l10n = l10n;
        this.config = vscode.workspace.getConfiguration('clickup');
    }

    async init(): Promise<string | undefined> {
        this.token = await this.getToken();

        if (this.token == '') {
            return;
        } else if (await this.isValid()) {
            return this.token;
        }

        return undefined;
    }

    async askToken(): Promise<boolean | undefined> {
        this.token = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: 'Enter your ClickUp API Token...',
        });

        if (!this.token) {
            return;
        } else if (!this.isValid()) {
            return;
        }

        return this.setToken(this.token);
    }

    async setToken(token: string | undefined): Promise<boolean | undefined> {
        await this.config.update(
            'apiToken',
            token,
            vscode.ConfigurationTarget.Global,
        );
        vscode.window.showInformationMessage(
            'ClickUp API Token set successfully!',
        );
        setTimeout(() => {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }, 500);
        return true;
    }

    async getToken(): Promise<string | undefined> {
        const config = vscode.workspace.getConfiguration('clickup');
        return config.get<string>('apiToken') || '';
    }

    async delete() {
        await this.config.update(
            'apiToken',
            '',
            vscode.ConfigurationTarget.Global,
        );
        return true;
    }

    isValid() {
        // If token doesn't exists show error message
        if (this.token === undefined || this.token === null) {
            vscode.window.showInformationMessage(
                this.l10n.t('NO_CLICKUP_TOKEN_SET'),
            );
            return false;
        }

        if (this.token.match(this.regex) === null) {
            vscode.window.showErrorMessage(this.l10n.t('INVALID_TOKEN'));
            return false;
        }

        return true;
    }
}
