import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DiscoveryResources } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { NavExtension } from '@console/dynamic-plugin-sdk/src/extensions/navigation';
import { isNavExtension } from '@console/dynamic-plugin-sdk/src/extensions/navigation';
import type { Perspective } from '@console/dynamic-plugin-sdk/src/extensions/perspectives';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useK8sModels } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModels';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { NamespaceModel, ProjectModel } from '@console/internal/models';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { FLAGS, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useMountedNamespaceBar } from './mounted-namespace-bar';
import { buildNamespaceCommands } from './namespace-commands';
import { buildPageCommands } from './page-commands';
import { buildResourceCommands } from './resource-commands';
import type { CommandPaletteCommand } from './types';

type CommandPaletteCommands = {
  commands: CommandPaletteCommand[];
  isProjects: boolean;
};

export const useCommandPaletteCommands = (
  perspectives: LoadedExtension<Perspective>[],
): CommandPaletteCommands => {
  const { t } = useTranslation('console-app');
  const [activePerspective] = useActivePerspective();
  const [activeNamespace] = useActiveNamespace();
  const navExtensions = useExtensions<NavExtension>(isNavExtension);
  const [models] = useK8sModels();
  const canListNamespaces = useFlag(FLAGS.CAN_LIST_NS);
  const isNamespaceBarDisabled = !!useMountedNamespaceBar()?.isDisabled;

  const groupVersionMap = useConsoleSelector<DiscoveryResources['groupVersionMap']>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'groupToVersionMap']),
  );

  const isProjects = useConsoleSelector<boolean>(({ k8s }) =>
    k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]),
  );

  const [namespaces] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(isProjects ? ProjectModel : NamespaceModel),
    isList: true,
    optional: true,
  });

  const perspectiveProperties = useMemo(
    () => perspectives.map((perspective) => perspective.properties),
    [perspectives],
  );

  const pageCommands = useMemo(
    () =>
      buildPageCommands({
        navExtensions,
        perspectives: perspectiveProperties,
        activePerspective,
        activeNamespace,
        lastNamespace: sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY),
        models,
        t,
      }),
    [navExtensions, perspectiveProperties, activePerspective, activeNamespace, models, t],
  );

  const resourceCommands = useMemo(
    () =>
      buildResourceCommands({
        models: Object.values(models),
        groupVersionMap,
        navModels: pageCommands.flatMap((command) =>
          command.perspective === activePerspective && command.navModel ? [command.navModel] : [],
        ),
        activeNamespace,
        t,
      }),
    [models, groupVersionMap, pageCommands, activePerspective, activeNamespace, t],
  );

  const namespaceCommands = useMemo(
    () =>
      isNamespaceBarDisabled
        ? []
        : buildNamespaceCommands({
            namespaces: namespaces ?? [],
            canListNamespaces: !!canListNamespaces,
            isProjects,
            t,
          }),
    [isNamespaceBarDisabled, namespaces, canListNamespaces, isProjects, t],
  );

  const commands = useMemo(
    () => [...pageCommands, ...resourceCommands, ...namespaceCommands],
    [pageCommands, resourceCommands, namespaceCommands],
  );

  return { commands, isProjects };
};
