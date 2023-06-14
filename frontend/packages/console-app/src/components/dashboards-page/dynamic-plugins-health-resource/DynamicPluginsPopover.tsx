import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WatchK8sResults, WatchK8sResources } from '@console/dynamic-plugin-sdk';
import { ConsoleOperatorConfigModel, ConsolePluginModel } from '@console/internal/models';
import { ConsolePluginKind, referenceForModel } from '@console/internal/module/k8s';
import { isLoadedDynamicPluginInfo, isNotLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import { StatusPopupSection } from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import NotLoadedDynamicPlugins from './NotLoadedDynamicPlugins';

const DynamicPluginsPopover: React.FC<DynamicPluginsPopoverProps> = ({ consolePlugins }) => {
  const { t } = useTranslation();
  const [pluginInfoEntries] = useDynamicPluginInfo();
  const notLoadedDynamicPluginInfo = pluginInfoEntries.filter(isNotLoadedDynamicPluginInfo);
  const failedPlugins = notLoadedDynamicPluginInfo.filter((plugin) => plugin.status === 'Failed');
  const pendingPlugins = notLoadedDynamicPluginInfo.filter((plugin) => plugin.status === 'Pending');
  const loadedPlugins = pluginInfoEntries.filter(isLoadedDynamicPluginInfo);
  const enabledPlugins = loadedPlugins.filter((plugin) => plugin.enabled === true);
  const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';

  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          'console-app~A dynamic plugin allows you to add custom pages and other extensions to your interface at runtime.',
        )}
      </StackItem>
      {failedPlugins.length > 0 && (
        <NotLoadedDynamicPlugins plugins={failedPlugins} label={t('console-app~Failed plugins')} />
      )}
      {pendingPlugins.length > 0 && (
        <NotLoadedDynamicPlugins
          plugins={pendingPlugins}
          label={t('console-app~Pending plugins')}
        />
      )}
      <StackItem>
        <StatusPopupSection
          firstColumn={t('console-app~Loaded plugins')}
          secondColumn={
            <>
              {t('console-app~{{enabledCount}}/{{totalCount}} enabled', {
                enabledCount: developmentMode ? loadedPlugins.length : enabledPlugins.length,
                totalCount: developmentMode ? loadedPlugins.length : consolePlugins.data.length,
              })}
            </>
          }
        >
          <Link
            to={`/k8s/cluster/${referenceForModel(
              ConsoleOperatorConfigModel,
            )}/cluster/console-plugins`}
          >
            {t('console-app~View all')}
          </Link>
        </StatusPopupSection>
      </StackItem>
    </Stack>
  );
};

/** Used in extension */
export const dynamicPluginsResources: WatchK8sResources<WatchConsolePluginsResource> = {
  consolePlugins: {
    kind: referenceForModel(ConsolePluginModel),
    namespaced: false,
    isList: true,
  },
};

type WatchConsolePluginsResource = {
  consolePlugins: ConsolePluginKind[];
};

type DynamicPluginsPopoverProps = WatchK8sResults<WatchConsolePluginsResource>;

export default DynamicPluginsPopover;
