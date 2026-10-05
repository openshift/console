import { useCallback } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ConsolePluginTableRow } from './ConsolePluginsTable';

export const useConsolePluginBulkActions = (consoleOperatorConfig: K8sResourceKind | null) => {
  const { t } = useTranslation('console-app');
  const [handlePromise, inProgress] = usePromiseHandler();
  const toast = useToast();

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

      return [
        {
          id: 'enable-plugins',
          label: t('Enable'),
          description: t('Applies to {{count}} selected plugins that are currently disabled.', {
            count: enableableCount,
          }),
          disabled: inProgress || !consoleOperatorConfig || enableableCount === 0,
          cta: handleBulkEnable,
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
    [consoleOperatorConfig, handlePromise, inProgress, toast, t],
  );
};
