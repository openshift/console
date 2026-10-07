import { useCallback } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { ConsolePluginUserTokenWarning } from '@console/shared/src/components/utils/ConsolePluginWarning';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import type { ConsolePluginTableRow } from './ConsolePluginsTable';

export const useConsolePluginBulkActions = (consoleOperatorConfig: K8sResourceKind | null) => {
  const { t } = useTranslation('console-app');
  const [handlePromise, inProgress] = usePromiseHandler();
  const toast = useToast();
  const launchWarningModal = useWarningModal();

  return useCallback(
    (selectedPlugins: ConsolePluginTableRow[], onComplete: () => void): Action[] => {
      const enableableCount = selectedPlugins.filter((plugin) => !plugin.enabled).length;
      const disableableCount = selectedPlugins.length - enableableCount;

      const handleBulkEnable = () => {
        if (!consoleOperatorConfig) return;
        const currentPlugins: string[] | undefined = consoleOperatorConfig.spec?.plugins;
        const pluginsToEnable = selectedPlugins
          .filter((plugin) => !plugin.enabled)
          .map((plugin) => plugin.name);
        const newPlugins = [...new Set([...(currentPlugins ?? []), ...pluginsToEnable])];
        const patches = currentPlugins
          ? [
              { op: 'test', path: '/spec/plugins', value: currentPlugins },
              { op: 'replace', path: '/spec/plugins', value: newPlugins },
            ]
          : [{ op: 'add', path: '/spec/plugins', value: newPlugins }];

        handlePromise(k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, patches))
          .then(onComplete)
          .catch((error) => {
            toast.addToast({
              variant: AlertVariant.danger,
              title: t('Failed to enable plugins'),
              content: error?.message || t('An error occurred. Try again.'),
            });
          });
      };

      const handleBulkDisable = () => {
        if (!consoleOperatorConfig) return;
        const currentPlugins: string[] | undefined = consoleOperatorConfig.spec?.plugins;
        if (!currentPlugins) return;
        const pluginsToDisable = new Set(
          selectedPlugins.filter((plugin) => plugin.enabled).map((plugin) => plugin.name),
        );
        const newPlugins = currentPlugins.filter((plugin) => !pluginsToDisable.has(plugin));
        const patches = [
          { op: 'test', path: '/spec/plugins', value: currentPlugins },
          { op: 'replace', path: '/spec/plugins', value: newPlugins },
        ];

        handlePromise(k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, patches))
          .then(onComplete)
          .catch((error) => {
            toast.addToast({
              variant: AlertVariant.danger,
              title: t('Failed to disable plugins'),
              content: error?.message || t('An error occurred. Try again.'),
            });
          });
      };

      const confirmBulkEnable = () => {
        const userTokenPlugins = selectedPlugins.filter(
          (plugin) =>
            !plugin.enabled && plugin.proxies?.some((proxy) => proxy.authorization === 'UserToken'),
        );
        if (userTokenPlugins.length === 0) {
          handleBulkEnable();
          return;
        }
        launchWarningModal({
          title: t('Enable plugins with user token access?'),
          confirmButtonLabel: t('Enable'),
          onConfirm: handleBulkEnable,
          children: userTokenPlugins.map((plugin) => (
            <div key={plugin.name}>
              <p>{plugin.name}</p>
              <ConsolePluginUserTokenWarning proxies={plugin.proxies} />
            </div>
          )),
        });
      };

      return [
        {
          id: 'enable-plugins',
          label: t('Enable'),
          description: t('Applies to {{count}} selected plugins that are currently disabled.', {
            count: enableableCount,
          }),
          disabled: inProgress || !consoleOperatorConfig || enableableCount === 0,
          cta: confirmBulkEnable,
        },
        {
          id: 'disable-plugins',
          label: t('Disable'),
          description: t('Applies to {{count}} selected plugins that are currently enabled.', {
            count: disableableCount,
          }),
          disabled: inProgress || !consoleOperatorConfig || disableableCount === 0,
          cta: handleBulkDisable,
        },
      ];
    },
    [consoleOperatorConfig, handlePromise, inProgress, launchWarningModal, toast, t],
  );
};
