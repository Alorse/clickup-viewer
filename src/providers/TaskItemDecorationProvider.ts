import * as vscode from 'vscode';

export class TaskItemDecorationProvider
    implements vscode.FileDecorationProvider
{
    private _onDidChangeFileDecorations = new vscode.EventEmitter<
        vscode.Uri | vscode.Uri[]
    >();
    readonly onDidChangeFileDecorations: vscode.Event<
        vscode.Uri | vscode.Uri[]
    > = this._onDidChangeFileDecorations.event;

    constructor() {
        vscode.window.registerFileDecorationProvider(this);
    }

    provideFileDecoration(
        uri: vscode.Uri,
    ): vscode.ProviderResult<vscode.FileDecoration> {
        if (uri.scheme !== 'clickup-viewer') {
            return null;
        }

        const query = new URLSearchParams(uri.query);
        const color = query.get('color');

        return {
            badge: '',
            tooltip: '',
            color: color ? new vscode.ThemeColor(color) : undefined,
        };
    }

    refresh(uri: vscode.Uri): void {
        this._onDidChangeFileDecorations.fire(uri);
    }

    dispose(): void {
        this._onDidChangeFileDecorations.dispose();
    }
}
