import * as l10n from '@vscode/l10n';
import * as translations from '../l10n/bundle.l10n.json';

l10n.config({
    contents: translations,
});


// extension.ts
export const NO_CLICKUP_TOKEN_SET = l10n.t('NO_CLICKUP_TOKEN_SET');
export const TASK_TOOLTIP = l10n.t("TASK_TOOLTIP");
export const TASK_FORGOTTEN = l10n.t("TASK_FORGOTTEN");
export const SET_TOKEN = l10n.t('SET_TOKEN');
export const DELETE_TOKEN = l10n.t('DELETE_TOKEN');
export const NO_TASK_SELECTED = l10n.t("NO_TASK_SELECTED");
export const NO_LIST_ID = l10n.t("NO_LIST_ID");
export const STATUS_READ_ERROR = l10n.t("STATUS_READ_ERROR");
export const TOKEN_NOT_FOUND = l10n.t("TOKEN_NOT_FOUND");
export const INVALID_TOKEN = l10n.t("INVALID_TOKEN");
export const YOUR_TOKEN = l10n.t("YOUR_TOKEN");


export const TASK_UPDATE_MESSAGE = l10n.t('TASK_UPDATE_MESSAGE');
export const TASK_UPDATE_ERROR_MESSAGE = l10n.t('TASK_UPDATE_ERROR_MESSAGE');

export const DEFAULT_TASK_DETAILS = [
    'id', 'name', 'description', 'url', 'status', 'priority', 'creator', 'tags', 'assignees'
];