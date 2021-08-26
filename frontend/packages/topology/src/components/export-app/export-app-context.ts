import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { USERSETTINGS_PREFIX, useToast, useUserSettings } from '@console/shared/src';
import { ExportAppUserSettings } from './types';

export const ExportAppContext = React.createContext({});

export const ExportAppContextProvider = ExportAppContext.Provider;

export const useExportAppFormToast = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [exportAppToast, setExportAppToast, exportAppToastLoaded] = useUserSettings<
    ExportAppUserSettings
  >(`${USERSETTINGS_PREFIX}.exportApp`, {}, true);

  const exportAppWatchResources = React.useMemo(() => {
    if (!exportAppToastLoaded && _.isEmpty(exportAppToast)) return {};
    const keys = Object.keys(exportAppToast);
    const watchRes = keys.reduce((acc, k) => {
      const { kind, name, namespace: resNamespace } = exportAppToast[k];
      acc[k] = {
        kind,
        name,
        namespace: resNamespace,
        namespaced: true,
        isList: false,
        optional: true,
      };
      return acc;
    }, {});
    return watchRes;
  }, [exportAppToast, exportAppToastLoaded]);

  const extraResources = useK8sWatchResources<{ [k: string]: K8sResourceKind }>(
    exportAppWatchResources,
  );

  const showDownloadToast = React.useCallback(
    (expNamespace: string, routeUrl: string) => {
      toast.addToast({
        variant: AlertVariant.info,
        title: t('topology~Export Application'),
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
              window.open(routeUrl, '_blank');
            },
            component: 'a',
          },
        ],
      });
    },
    [t, toast],
  );

  React.useEffect(() => {
    if (exportAppToastLoaded) {
      const keys = Object.keys(exportAppToast);
      keys.forEach((k) => {
        if (
          extraResources[k].loaded &&
          !extraResources[k].loadError &&
          extraResources[k].data &&
          exportAppToast[k].uid === extraResources[k].data.metadata.uid &&
          extraResources[k].data.status?.completed &&
          extraResources[k].data.status?.route
        ) {
          const exportAppToastConfig = _.omit(exportAppToast, k);
          setExportAppToast(exportAppToastConfig);
          showDownloadToast(
            extraResources[k].data.metadata.namespace,
            extraResources[k].data.status.route,
          );
        }
      });
    }
  }, [extraResources, exportAppToast, exportAppToastLoaded, setExportAppToast, showDownloadToast]);
};
