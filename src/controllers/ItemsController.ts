import { Team, Space } from '../types';
import { ApiWrapper } from '../lib/ApiWrapper';
import { LocalStorageController } from './LocalStorageController';

export class ItemsController {
    apiWrapper: ApiWrapper;
    storageManager: LocalStorageController;
    teams: Team[];
    spaces: Space[];

    constructor(apiWrapper: ApiWrapper, storageManager: LocalStorageController) {
        this.apiWrapper = apiWrapper;
        this.storageManager = storageManager;
        this.teams = [];
        this.spaces = [];
    }

    async getTeams(): Promise<Team[]> {
        const storedTeams: Team[] = await this.storageManager.getValue('teams');
        if (storedTeams) {
            if (Array.isArray(storedTeams)) {
                this.teams = storedTeams.map((team: Team) => ({
                    id: team.id,
                    name: team.name,
                    color: team.color,
                    avatar: team.avatar,
                    members: team.members,
                }));
            }
        } else {
            this.teams = await this.apiWrapper.getTeams();
            await this.storageManager.setValue('teams', this.teams);
        }

        return this.teams;
    }

    async getSpaces(teamId: string): Promise<Space[]> {
        const storedSpaces: Space[] = await this.storageManager.getValue(`space-${teamId}`);
        if (storedSpaces) {
            this.spaces = storedSpaces;
        } else {
            this.spaces = await this.apiWrapper.getSpaces(teamId);
            await this.storageManager.setValue(`space-${teamId}`, this.spaces);
        }

        return this.spaces;
    }

    async resetTeams() {
        this.storageManager.deleteKey('teams');
    }

    async refreshSpaces(teamId: string) {
        this.spaces = await this.apiWrapper.getSpaces(teamId);
        await this.storageManager.setValue(`space-${teamId}`, this.spaces);
    }
}
