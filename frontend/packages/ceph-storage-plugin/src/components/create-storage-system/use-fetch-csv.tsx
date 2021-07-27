import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  SubscriptionKind,
} from '@console/operator-lifecycle-manager/src';
import { referenceForModel } from '@console/internal/module/k8s';
import { subscriptionResource } from '../../resources';

export const useFetchCsv = (specName: string): UseFetchCsvResult => {
  const { t } = useTranslation();
  const [subs, subsLoaded, subsLoadError] = useK8sWatchResource<SubscriptionKind[]>(
    subscriptionResource,
  );
  const csvName = React.useRef<string>(null);
  const csvNamespace = React.useRef<string>(null);

  React.useEffect(() => {
    if (subsLoaded && !subsLoadError && subs.length) {
      const sub = subs.find((s) => s.spec.name === specName);
      csvName.current = sub?.status?.installedCSV;
      csvNamespace.current = sub?.metadata?.namespace;
    }
  }, [specName, subs, subsLoadError, subsLoaded]);

  const [csv, csvLoaded, csvLoadError] = useK8sWatchResource<ClusterServiceVersionKind>({
    kind: referenceForModel(ClusterServiceVersionModel),
    name: csvName.current,
    namespaced: true,
    namespace: csvNamespace.current,
    isList: false,
  });

  if (csvName.current === null || csvNamespace.current === null) {
    return [undefined, false, undefined];
  }

  if (!csvName.current || !csvNamespace.current) {
    return [undefined, true, new Error(t('ceph-storage-plugin~Not found'))];
  }

  return [csv, csvLoaded, csvLoadError];
};

type UseFetchCsvResult = [ClusterServiceVersionKind, boolean, any];
