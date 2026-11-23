import type { TFunction } from 'i18next';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { CommandPaletteCommand } from './types';

type NamespaceCommand = Extract<CommandPaletteCommand, { type: 'namespace' }>;

type NamespaceCommandOptions = {
  namespaces: K8sResourceCommon[];
  canListNamespaces: boolean;
  isProjects: boolean;
  t: TFunction;
};

const toNamespaceCommand = (namespace: string, title: string): NamespaceCommand => ({
  type: 'namespace',
  id: `namespace:${namespace}`,
  title,
  aliases: [],
  keywords: [],
  namespace,
});

export const buildNamespaceCommands = ({
  namespaces,
  canListNamespaces,
  isProjects,
  t,
}: NamespaceCommandOptions): NamespaceCommand[] => {
  const allNamespacesCommands = canListNamespaces
    ? [
        toNamespaceCommand(
          ALL_NAMESPACES_KEY,
          isProjects ? t('console-app~All projects') : t('console-app~All namespaces'),
        ),
      ]
    : [];

  return [
    ...allNamespacesCommands,
    ...namespaces
      .map((namespace) => namespace.metadata?.name)
      .filter(Boolean)
      .map((name) => toNamespaceCommand(name, name)),
  ];
};
