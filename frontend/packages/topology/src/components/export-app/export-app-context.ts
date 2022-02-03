import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { USERSETTINGS_PREFIX, useToast, useUserSettings } from '@console/shared/src';
import { ExportModel } from '../../models';
import { ExportAppUserSettings } from './types';

export const ExportAppContext = React.createContext({});

export const ExportAppContextProvider = ExportAppContext.Provider;

export const useExportAppFormToast = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [currentToasts, setCurrentToasts] = React.useState<{ [key: string]: { toastId: string } }>(
    {},
  );
  const [exportAppToast, setExportAppToast, exportAppToastLoaded] = useUserSettings<
    ExportAppUserSettings
  >(`${USERSETTINGS_PREFIX}.exportApp`, {}, true);

  const exportAppWatchResources = React.useMemo<Record<string, WatchK8sResource>>(() => {
    if (!exportAppToastLoaded || _.isEmpty(exportAppToast)) return {};
    const keys = Object.keys(exportAppToast);
    const watchRes = keys.reduce((acc, k) => {
      const { groupVersionKind, name, namespace: resNamespace } = exportAppToast[k];
      acc[k] = {
        groupVersionKind: groupVersionKind || getGroupVersionKindForModel(ExportModel),
        name,
        namespace: resNamespace,
        namespaced: true,
        isList: false,
        optional: true,
      };
      return acc;
    }, {} as Record<string, WatchK8sResource>);
    return watchRes;
  }, [exportAppToast, exportAppToastLoaded]);

  const exportResources = useK8sWatchResources<{ [k: string]: K8sResourceKind }>(
    exportAppWatchResources,
  );

  const cleanToast = React.useCallback(
    (k: string) => {
      const toastDismiss = currentToasts[k];
      if (toastDismiss) {
        toast.removeToast(toastDismiss.toastId);
        setCurrentToasts(_.omit(currentToasts, k));
      }
    },
    [currentToasts, toast],
  );

  const cleanToastConfig = React.useCallback(
    (k: string) => {
      if (exportAppToastLoaded) {
        setExportAppToast(_.omit(exportAppToast, k));
      }
    },
    [exportAppToast, exportAppToastLoaded, setExportAppToast],
  );

  React.useEffect(() => {
    if (exportResources) {
      const keys = Object.keys(exportResources);
      keys.forEach((k) => {
        if (exportResources[k].loadError?.response?.status === 404) {
          cleanToast(k);
          cleanToastConfig(k);
        }
      });
    }
  }, [cleanToast, cleanToastConfig, exportResources]);

  const showDownloadToast = React.useCallback(
    (expNamespace: string, routeUrl: string, key: string) => {
      const toastId = toast.addToast({
        variant: AlertVariant.info,
        title: t('topology~Export application'),
        content: t(
          'topology~All the resources are exported successfully from {{namespace}}. Click below to download it.',
          {
            namespace: expNamespace,
          },
        ),
        dismissible: true,
        actions: [
          {
            dismiss: true,
            label: t('topology~Download'),
            callback: () => {
              cleanToast(key);
              cleanToastConfig(key);
              window.open(routeUrl, '_blank');
            },
            component: 'a',
          },
        ],
        onClose: () => cleanToastConfig(key),
      });
      setCurrentToasts((toasts) => ({ ...toasts, [key]: { toastId } }));
    },
    [cleanToast, cleanToastConfig, t, toast],
  );

  React.useEffect(() => {
    if (exportAppToastLoaded) {
      const keys = Object.keys(exportAppToast);
      keys.forEach((k) => {
        const isValidResource =
          exportResources[k].loaded &&
          !exportResources[k].loadError &&
          exportResources[k].data &&
          exportAppToast[k].uid === exportResources[k].data.metadata.uid;
        if (
          isValidResource &&
          exportResources[k].data.status?.completed &&
          exportResources[k].data.status?.route &&
          !currentToasts[k]
        ) {
          showDownloadToast(
            exportResources[k].data.metadata.namespace,
            exportResources[k].data.status.route,
            k,
          );
        } else if (
          isValidResource &&
          !exportResources[k].data.status?.completed &&
          currentToasts[k]
        ) {
          cleanToast(k);
        }
      });
    }
  }, [
    exportResources,
    exportAppToast,
    exportAppToastLoaded,
    showDownloadToast,
    currentToasts,
    cleanToast,
  ]);
};
