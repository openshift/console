import type { FC } from 'react';
import { Alert, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { WatchK8sResults, WatchK8sResources } from '@console/dynamic-plugin-sdk';
import { PluginCSPViolations } from '@console/internal/actions/ui';
import { ConsoleOperatorConfigModel, ConsolePluginModel } from '@console/internal/models';
import { ConsolePluginKind, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { StatusPopupSection } from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import NotLoadedDynamicPlugins from './NotLoadedDynamicPlugins';

const DynamicPluginsPopover: FC<DynamicPluginsPopoverProps> = ({ consolePlugins }) => {
  const { t } = useTranslation();
  const pluginInfoEntries = usePluginInfo();
  const cspViolations = useSelector<RootState, PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );
  const notLoadedDynamicPluginInfo = pluginInfoEntries.filter(
    (plugin) => plugin.status !== 'loaded',
  );
  const failedPlugins = notLoadedDynamicPluginInfo.filter((plugin) => plugin.status === 'failed');
  const pendingPlugins = notLoadedDynamicPluginInfo.filter((plugin) => plugin.status === 'pending');
  const loadedPlugins = pluginInfoEntries.filter((plugin) => plugin.status === 'loaded');
  const loadedPluginsWithCSPViolations = loadedPlugins.filter(
    (plugin) => cspViolations[plugin.manifest.name] ?? false,
  );
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
          {loadedPluginsWithCSPViolations.length > 0 && (
            <Alert
              variant="warning"
              isInline
              isPlain
              title={t(
                'console-app~One or more plugins might have Content Security Policy violations.',
              )}
            />
          )}
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
