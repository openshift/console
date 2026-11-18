import type { GetDataViewCell } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { withFallback } from '@console/shared/src/components/error/fallbacks/withFallback';
import {
  getClusterVersion,
  getLifecycleInfoFromSubscription,
  getPackageNameFromCSV,
  useOperatorLifecycle,
} from '../hooks/useOperatorLifecycle';
import { ClusterServiceVersionModel } from '../models';
import { subscriptionForCSV } from '../status/csv-status';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import {
  ClusterCompatibilityStatus,
  getClusterCompatibility,
  getSupportPhase,
  SupportPhaseBadge,
} from './operator-lifecycle-status';

type InstalledOperator = ClusterServiceVersionKind | SubscriptionKind;

type LifecycleRowData = {
  subscriptions: SubscriptionKind[];
};

const isCSV = (obj: InstalledOperator): obj is ClusterServiceVersionKind =>
  referenceFor(obj) === referenceForModel(ClusterServiceVersionModel);

/** Both lifecycle cells share the hook's cache, which de-duplicates their requests. */
const useCsvLifecycle = (obj: ClusterServiceVersionKind, subscription?: SubscriptionKind) => {
  const { catalogName, catalogNamespace } = getLifecycleInfoFromSubscription(subscription);
  const packageName = getPackageNameFromCSV(obj, subscription);
  const [lifecycleData] = useOperatorLifecycle(packageName, catalogName, catalogNamespace);
  return lifecycleData;
};

const CsvClusterCompatibilityCell = withFallback<{
  obj: ClusterServiceVersionKind;
  subscription?: SubscriptionKind;
}>(({ obj, subscription }) => {
  const lifecycleData = useCsvLifecycle(obj, subscription);
  const compatible = getClusterCompatibility(lifecycleData, obj.spec?.version, getClusterVersion());
  return <ClusterCompatibilityStatus compatible={compatible} />;
});

const CsvSupportPhaseCell = withFallback<{
  obj: ClusterServiceVersionKind;
  subscription?: SubscriptionKind;
}>(({ obj, subscription }) => {
  const lifecycleData = useCsvLifecycle(obj, subscription);
  return <SupportPhaseBadge phase={getSupportPhase(lifecycleData, obj.spec?.version)} />;
});

export const getClusterCompatibilityCell: GetDataViewCell<InstalledOperator, LifecycleRowData> = (
  data,
) =>
  data.map(({ obj, rowData }) => {
    if (!isCSV(obj)) {
      return { cell: '-' };
    }
    const subscription = subscriptionForCSV(rowData.subscriptions, obj);
    return { cell: <CsvClusterCompatibilityCell obj={obj} subscription={subscription} /> };
  });

export const getSupportPhaseCell: GetDataViewCell<InstalledOperator, LifecycleRowData> = (data) =>
  data.map(({ obj, rowData }) => {
    if (!isCSV(obj)) {
      return { cell: '-' };
    }
    const subscription = subscriptionForCSV(rowData.subscriptions, obj);
    return { cell: <CsvSupportPhaseCell obj={obj} subscription={subscription} /> };
  });
