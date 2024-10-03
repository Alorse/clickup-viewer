import * as vscode from 'vscode';
import { Space, PickSpace } from '../types';
import { LocalStorageController } from './LocalStorageController';

export class PicksController {
    storageManager: LocalStorageController;

    constructor(storageManager: LocalStorageController) {
        this.storageManager = storageManager;
    }

    public async showQuickPick(
        teamId: string,
        spaces: Space[],
    ): Promise<boolean> {
        if (spaces.length <= 1) {
            vscode.window.showInformationMessage(
                'This filter is only available for teams with more than 1 space.',
            );
            return false;
        }

        const savedSpaces = await this.storageManager.getValue(
            `filtered-spaces-${teamId}`,
        );
        const filteredSpaces: PickSpace[] = (await vscode.window.showQuickPick(
            spaces.map((space) => ({
                label: space.name,
                picked: savedSpaces
                    ? savedSpaces?.includes(space.id) || false
                    : true,
                id: space.id,
            })),
            {
                placeHolder:
                    'Select the spaces from which you want to view your tasks.',
                ignoreFocusOut: true,
                canPickMany: true,
            },
        )) as PickSpace[];
        if (filteredSpaces) {
            await this.storageManager.setValue(
                `filtered-spaces-${teamId}`,
                filteredSpaces.map((space) => space.id),
            );
            return true;
        }
        return false;
    }
}
