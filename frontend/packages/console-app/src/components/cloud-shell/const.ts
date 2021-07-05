import { STORAGE_PREFIX, CONFIG_STORAGE_CONSOLE } from '@console/dynamic-plugin-sdk';

const STORAGE_CLOUDSHELL = 'terminal';

export const CLOUD_SHELL_NAMESPACE = `${STORAGE_PREFIX}/command-line-terminal-namespace`;
export const CLOUD_SHELL_NAMESPACE_CONFIG_STORAGE_KEY = `${CONFIG_STORAGE_CONSOLE}.${STORAGE_CLOUDSHELL}.namespace`;
