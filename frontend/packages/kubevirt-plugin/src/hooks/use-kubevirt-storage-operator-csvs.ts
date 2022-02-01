import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  SubscriptionModel,
} from '@console/operator-lifecycle-manager';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { useDebounceCallback } from './use-debounce';
import { useDeepCompareMemoize } from './use-deep-compare-memoize';

const LSO_NAME = 'local-storage-operator';
const ODF_OPERATOR_NAME = 'odf-operator';

const watchedResources = {
  installedCSVs: {
    kind: kubevirtReferenceForModel(ClusterServiceVersionModel),
    namespaced: false,
    isList: true,
  },
  subscriptions: {
    kind: kubevirtReferenceForModel(SubscriptionModel),
    namespaced: false,
    isList: true,
  },
};

const getSubscriptionForOperator = (subscriptions, operatorName) => {
  return _.find(subscriptions, (sub) => sub?.metadata?.name === operatorName);
};

const getCSVForInstalledVersion = (
  clusterServiceVersions,
  installedCSV,
): ClusterServiceVersionKind => {
  return _.find(clusterServiceVersions, (csv) => csv?.metadata?.name === installedCSV);
};

export const useKubevirtStorageOperatorCSVs = () => {
  const [csvsLoaded, setCSVsLoaded] = React.useState<boolean>(false);
  const [csvsLoadError, setCSVsLoadError] = React.useState<string>(null);
  const [lsoCSV, setCSVForLSO] = React.useState(null);
  const [odfCSV, setCSVForODF] = React.useState(null);

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  const updateResults = (updatedResources) => {
    const subsResult = updatedResources?.subscriptions;
    const csvsResult = updatedResources?.installedCSVs;
    setCSVsLoaded(csvsResult?.loaded);
    setCSVsLoadError(csvsResult?.loadError);

    if (Object.keys(updatedResources).length > 0) {
      const lsoSub = getSubscriptionForOperator(subsResult?.data, LSO_NAME);
      const lso = lsoSub
        ? getCSVForInstalledVersion(csvsResult?.data, lsoSub?.status?.installedCSV)
        : null;
      setCSVForLSO(lso);

      const odfSub = getSubscriptionForOperator(subsResult?.data, ODF_OPERATOR_NAME);
      const odf = odfSub
        ? getCSVForInstalledVersion(csvsResult?.data, odfSub?.status?.installedCSV)
        : null;
      setCSVForODF(odf);
    }
  };
  const debouncedUpdateResources = useDebounceCallback(updateResults, 50);

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({
    lsoCSV,
    odfCSV,
    loaded: csvsLoaded,
    loadError: csvsLoadError,
  });
};
