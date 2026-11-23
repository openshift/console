import type { TFunction } from 'i18next';
import type { CommandPaletteCommandType } from './types';

type CommandGroupDefinition = {
  type: CommandPaletteCommandType;
  getTitle: (t: TFunction, isProjects: boolean) => string;
};

export const COMMAND_GROUPS: CommandGroupDefinition[] = [
  { type: 'page', getTitle: (t) => t('console-app~Pages') },
  { type: 'resource', getTitle: (t) => t('console-app~Resource types') },
  {
    type: 'namespace',
    getTitle: (t, isProjects) =>
      isProjects ? t('console-app~Projects') : t('console-app~Namespaces'),
  },
];
