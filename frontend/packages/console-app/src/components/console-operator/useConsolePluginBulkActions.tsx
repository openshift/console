import { useMemo, useCallback } from 'react';
import { AlertVariant, DropdownItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { ResponsiveActionDropdown } from '@console/shared/src/components/dropdown/ResponsiveActionDropdown';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ConsolePluginTableRow } from './ConsolePluginsTable';

interface UseConsolePluginBulkActionsOptions {
  selectedPlugins: ConsolePluginTableRow[];
  consoleOperatorConfig: K8sResourceKind | null;
  onComplete: () => void;
}

export const useConsolePluginBulkActions = ({
  selectedPlugins,
  consoleOperatorConfig,
  onComplete,
}: UseConsolePluginBulkActionsOptions) => {
  const { t } = useTranslation('console-app');
  const [handlePromise, inProgress] = usePromiseHandler();
  const toast = useToast();

  const { enableableCount, disableableCount } = useMemo(() => {
    const enableable = selectedPlugins.filter((p) => !p.enabled).length;
    const disableable = selectedPlugins.filter((p) => p.enabled).length;
    return { enableableCount: enableable, disableableCount: disableable };
  }, [selectedPlugins]);

  const handleBulkEnable = useCallback(() => {
    if (!consoleOperatorConfig) return;
    const currentPlugins: string[] | undefined = consoleOperatorConfig.spec?.plugins;
    const pluginsToEnable = selectedPlugins.filter((p) => !p.enabled).map((p) => p.name);
    const newPlugins = [...new Set([...(currentPlugins ?? []), ...pluginsToEnable])];

    const patches = currentPlugins
      ? [
          { op: 'test', path: '/spec/plugins', value: currentPlugins },
          { op: 'replace', path: '/spec/plugins', value: newPlugins },
        ]
      : [{ op: 'add', path: '/spec/plugins', value: newPlugins }];

    handlePromise(k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, patches))
      .then(() => onComplete())
      .catch((err) => {
        toast.addToast({
          variant: AlertVariant.danger,
          title: t('Failed to enable plugins'),
          content: err?.message || t('An error occurred. Try again.'),
        });
      });
  }, [selectedPlugins, consoleOperatorConfig, handlePromise, onComplete, toast, t]);

  const handleBulkDisable = useCallback(() => {
    if (!consoleOperatorConfig) return;
    const currentPlugins: string[] | undefined = consoleOperatorConfig.spec?.plugins;
    if (!currentPlugins) return;
    const pluginsToDisable = new Set(selectedPlugins.filter((p) => p.enabled).map((p) => p.name));
    const newPlugins = currentPlugins.filter((p) => !pluginsToDisable.has(p));

    const patches = [
      { op: 'test', path: '/spec/plugins', value: currentPlugins },
      { op: 'replace', path: '/spec/plugins', value: newPlugins },
    ];

    handlePromise(k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, patches))
      .then(() => onComplete())
      .catch((err) => {
        toast.addToast({
          variant: AlertVariant.danger,
          title: t('Failed to disable plugins'),
          content: err?.message || t('An error occurred. Try again.'),
        });
      });
  }, [selectedPlugins, consoleOperatorConfig, handlePromise, onComplete, toast, t]);

  return useMemo(() => {
    const dropdownItems: JSX.Element[] = [];

    if (enableableCount > 0) {
      dropdownItems.push(
        <DropdownItem
          key="enable"
          onClick={handleBulkEnable}
          isDisabled={inProgress}
          data-test="bulk-enable-plugins"
          description={t('Applies to {{count}} selected plugins that are currently disabled.', {
            count: enableableCount,
          })}
        >
          {t('Enable')}
        </DropdownItem>,
      );
    }

    if (disableableCount > 0) {
      dropdownItems.push(
        <DropdownItem
          key="disable"
          onClick={handleBulkDisable}
          isDisabled={inProgress}
          data-test="bulk-disable-plugins"
          description={t('Applies to {{count}} selected plugins that are currently enabled.', {
            count: disableableCount,
          })}
        >
          {t('Disable')}
        </DropdownItem>,
      );
    }

    const isDisabled =
      inProgress ||
      !consoleOperatorConfig ||
      selectedPlugins.length === 0 ||
      dropdownItems.length === 0;

    return (
      <ResponsiveActionDropdown
        label={t('Plugin enablement')}
        isDisabled={isDisabled}
        data-test="bulk-plugin-actions-dropdown"
      >
        {dropdownItems}
      </ResponsiveActionDropdown>
    );
  }, [
    enableableCount,
    disableableCount,
    inProgress,
    consoleOperatorConfig,
    selectedPlugins.length,
    t,
    handleBulkEnable,
    handleBulkDisable,
  ]);
};
