import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { coFetchJSON } from '../co-fetch';
import { usePoll, useSafeFetch } from './utils';
import type { ConsolePluginManifestJSON } from '@console/dynamic-plugin-sdk/src/schema/plugin-manifest';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import { URL_POLL_DEFAULT_DELAY } from '@console/internal/components/utils/url-poll-hook';
import { useToast } from '@console/shared/src/components/toast';
import { AlertVariant } from '@patternfly/react-core';

interface CheckUpdatesApiResult {
  consoleCommit: string;
  plugins: string[];
  capabilities?: any[]; // since we just compare the values, the type doesn't matter
  contentSecurityPolicy?: string;
}

export const PollConsoleUpdates = React.memo(function PollConsoleUpdates() {
  const toastContext = useToast();
  const { t } = useTranslation();

  const [isToastOpen, setToastOpen] = React.useState(false);
  const [pluginsChanged, setPluginsChanged] = React.useState(false);
  const [pluginVersionsChanged, setPluginVersionsChanged] = React.useState(false);
  const [consoleChanged, setConsoleChanged] = React.useState(false);
  const [isFetchingPluginEndpoints, setIsFetchingPluginEndpoints] = React.useState(false);
  const [allPluginEndpointsReady, setAllPluginEndpointsReady] = React.useState(false);

  const [updateData, setUpdateData] = React.useState<CheckUpdatesApiResult>();
  const [updateError, setUpdateError] = React.useState<Error>();
  const [newPlugins, setNewPlugins] = React.useState<CheckUpdatesApiResult['plugins']>(null);
  const [pluginManifestsData, setPluginManifestsData] = React.useState<
    ConsolePluginManifestJSON[]
  >();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const safeFetch = React.useCallback(useSafeFetch(), []);
  const fetchPluginManifest = (pluginName: string): Promise<ConsolePluginManifestJSON> =>
    coFetchJSON(
      `${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}/plugin-manifest.json`,
      'get',
      { cache: 'no-cache' },
    );
  const tick = React.useCallback(() => {
    safeFetch(`${window.SERVER_FLAGS.basePath}api/check-updates`)
      .then((response) => {
        setUpdateData(response);
        setUpdateError(null);
        const pluginManifests = response?.plugins?.map((pluginName) =>
          fetchPluginManifest(pluginName),
        ) as Promise<ConsolePluginManifestJSON>[];
        if (pluginManifests) {
          settleAllPromises(pluginManifests).then(([fulfilledValues]) => {
            setPluginManifestsData(fulfilledValues);
          });
        }
      })
      .catch(setUpdateError);
  }, [safeFetch]);
  usePoll(tick, URL_POLL_DEFAULT_DELAY);

  const prevUpdateDataRef = React.useRef<CheckUpdatesApiResult>();
  const prevPluginManifestsDataRef = React.useRef<ConsolePluginManifestJSON[]>();
  React.useEffect(() => {
    prevUpdateDataRef.current = updateData;
    prevPluginManifestsDataRef.current = pluginManifestsData;
  });
  const prevUpdateData = prevUpdateDataRef.current;
  const prevPluginManifestsData = prevPluginManifestsDataRef.current;
  const stateInitialized = _.isEmpty(updateError) && !_.isEmpty(prevUpdateData);
  const pluginsAddedList = updateData?.plugins.filter((x) => !prevUpdateData?.plugins.includes(x));
  const pluginsRemovedList = prevUpdateData?.plugins.filter(
    (x) => !updateData?.plugins.includes(x),
  );
  const pluginsAdded = !_.isEmpty(pluginsAddedList);
  const pluginsRemoved = !_.isEmpty(pluginsRemovedList);

  if (stateInitialized && pluginsAdded && !pluginsChanged) {
    setPluginsChanged(true);
    setNewPlugins(pluginsAddedList);
  }

  if (stateInitialized && pluginsRemoved && !consoleChanged) {
    setConsoleChanged(true);
  }

  if (pluginsChanged && !allPluginEndpointsReady && !isFetchingPluginEndpoints) {
    const pluginEndpointsReady =
      newPlugins?.map((pluginName) => fetchPluginManifest(pluginName)) ?? [];
    if (!_.isEmpty(pluginEndpointsReady)) {
      settleAllPromises(pluginEndpointsReady).then(([, rejectedReasons]) => {
        if (!_.isEmpty(rejectedReasons)) {
          setAllPluginEndpointsReady(false);
          setTimeout(() => setIsFetchingPluginEndpoints(false), URL_POLL_DEFAULT_DELAY);
          return;
        }
        setAllPluginEndpointsReady(true);
        setIsFetchingPluginEndpoints(false);
        setNewPlugins(null);
      });
      setIsFetchingPluginEndpoints(true);
    } else {
      setAllPluginEndpointsReady(true);
      setIsFetchingPluginEndpoints(false);
    }
  }

  const pluginManifestsVersionsChanged = pluginManifestsData?.some((manifest) => {
    return prevPluginManifestsData?.some((previousManifest) => {
      return (
        manifest.name === previousManifest.name && manifest.version !== previousManifest.version
      );
    });
  });
  if (
    stateInitialized &&
    !_.isEmpty(prevPluginManifestsData) &&
    pluginManifestsVersionsChanged &&
    !pluginVersionsChanged
  ) {
    setPluginVersionsChanged(true);
  }

  const consoleCapabilitiesChanged = !_.isEqual(
    prevUpdateData?.capabilities,
    updateData?.capabilities,
  );
  const consoleCSPChanged = !_.isEqual(
    prevUpdateData?.contentSecurityPolicy,
    updateData?.contentSecurityPolicy,
  );
  const consoleCommitChanged = prevUpdateData?.consoleCommit !== updateData?.consoleCommit;

  if (
    stateInitialized &&
    (consoleCommitChanged || consoleCapabilitiesChanged || consoleCSPChanged) &&
    !consoleChanged
  ) {
    setConsoleChanged(true);
  }

  if (isToastOpen || !stateInitialized) {
    return null;
  }

  if (!pluginsChanged && !pluginVersionsChanged && !consoleChanged) {
    return null;
  }

  if (pluginsChanged && !allPluginEndpointsReady) {
    return null;
  }

  const toastCallback = () => {
    setToastOpen(false);
    setPluginsChanged(false);
    setPluginVersionsChanged(false);
    setConsoleChanged(false);
    setAllPluginEndpointsReady(false);
    setIsFetchingPluginEndpoints(false);
  };

  toastContext.addToast({
    variant: AlertVariant.warning,
    title: t('public~Web console update is available'),
    content: t(
      'public~There has been an update to the web console. Ensure any changes have been saved and refresh your browser to access the latest version.',
    ),
    timeout: false,
    dismissible: true,
    actions: [
      {
        dismiss: true,
        label: t('public~Refresh web console'),
        callback: () => {
          if (window.location.pathname.includes('/operatorhub/subscribe')) {
            window.location.href = '/operatorhub';
          } else {
            window.location.reload();
          }
        },
        dataTest: 'refresh-web-console',
      },
    ],
    onClose: toastCallback,
    onRemove: toastCallback,
  });

  setToastOpen(true);
  return null;
});
