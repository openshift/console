import * as React from 'react';
import * as _ from 'lodash';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceCommon, referenceForModel } from '@console/internal/module/k8s';
import {
  CatalogSourceModel,
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  SubscriptionKind,
  SubscriptionModel,
} from '@console/operator-lifecycle-manager';
import { catalogSourceForSubscription } from '@console/operator-lifecycle-manager/src/components/subscription';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { useDebounceCallback } from './use-debounce';
import { useDeepCompareMemoize } from './use-deep-compare-memoize';

const getKubevirtCSV = (clusterServiceVersions, installedCSV): ClusterServiceVersionKind => {
  return _.find(clusterServiceVersions, (csv) => csv?.metadata?.name === installedCSV);
};

const getKubevirtSubscription = (subscriptions) => {
  return _.find(subscriptions, (sub) => sub?.metadata?.name === 'hco-operatorhub');
};

const isPackageServer = (obj) =>
  obj?.metadata?.name === 'packageserver' &&
  obj?.metadata?.namespace === 'openshift-operator-lifecycle-manager';

export type UseKubevirtCsvDetails = {
  name: string;
  provider: string;
  version: string;
  updateChannel: string;
  kubevirtSub: SubscriptionKind;
  catalogSourceMissing: boolean;
  loaded: boolean;
  loadError: string;
};

export const useKubevirtCsvDetails = (): UseKubevirtCsvDetails => {
  const [name, setName] = React.useState<string>();
  const [provider, setProvider] = React.useState<string>();
  const [version, setVersion] = React.useState<string>();
  const [updateChannel, setUpdateChannel] = React.useState<string>();
  const [kubevirtSub, setKubevirtSub] = React.useState<SubscriptionKind>();
  const [catalogSourceMissing, setCatalogSourceMissing] = React.useState<boolean>(false);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');

  const watchedResources = {
    installedCSVs: {
      kind: kubevirtReferenceForModel(ClusterServiceVersionModel),
      isList: true,
      namespaced: false,
    },
    subscriptions: {
      kind: referenceForModel(SubscriptionModel),
      isList: true,
      namespaced: false,
    },
    catalogSources: {
      kind: referenceForModel(CatalogSourceModel),
      isList: true,
      optional: true,
    },
  };

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  const updateResults = (updatedResources) => {
    const errorKey = Object.keys(updatedResources).find((key) => updatedResources[key].loadError);
    if (errorKey) {
      setLoaded(false);
      setLoadError(updatedResources[errorKey].loadError);
      return;
    }

    if (
      Object.keys(updatedResources).length > 0 &&
      Object.keys(updatedResources).every((key) => updatedResources[key].loaded)
    ) {
      const kubevirtSubscription: SubscriptionKind = getKubevirtSubscription(
        updatedResources.subscriptions.data,
      );

      const kubevirtCSV: ClusterServiceVersionKind = getKubevirtCSV(
        updatedResources.installedCSVs.data,
        kubevirtSubscription?.status?.installedCSV,
      );

      const catalogSrcMissing =
        !_.isEmpty(updatedResources.catalogSources.data) &&
        !catalogSourceForSubscription(updatedResources.catalogSources.data, kubevirtSub) &&
        !isPackageServer(kubevirtCSV);

      setName(kubevirtCSV?.spec?.displayName);
      setProvider(kubevirtCSV?.spec?.provider?.name);
      setVersion(kubevirtCSV?.spec?.version);
      setUpdateChannel(kubevirtSubscription?.spec?.channel);
      setKubevirtSub(kubevirtSubscription);
      setCatalogSourceMissing(catalogSrcMissing);

      setLoaded(true);
      setLoadError(null);
    }
  };
  const debouncedUpdateResources = useDebounceCallback(updateResults, 50);

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({
    name,
    provider,
    version,
    updateChannel,
    kubevirtSub,
    catalogSourceMissing,
    loaded,
    loadError,
  });
};
