import { STORAGE_PREFIX, USER_PREFERENCE_PREFIX } from '@console/shared';

const STORAGE_CLOUDSHELL = 'terminal';

export const CLOUD_SHELL_NAMESPACE = `${STORAGE_PREFIX}/command-line-terminal-namespace`;
export const CLOUD_SHELL_NAMESPACE_CONFIG_USER_PREFERENCE_KEY = `${USER_PREFERENCE_PREFIX}.${STORAGE_CLOUDSHELL}.namespace`;
