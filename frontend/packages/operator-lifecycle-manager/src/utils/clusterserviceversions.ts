import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { OLMAnnotation } from '../components/operator-hub';
import { NON_STANDALONE_ANNOTATION_VALUE } from '../const';
import { ClusterServiceVersionModel } from '../models';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import { ClusterServiceVersionPhase } from '../types';

export const isCSV = (obj: K8sResourceKind): boolean =>
  Boolean(obj) && referenceFor(obj) === referenceForModel(ClusterServiceVersionModel);

export const isCopiedCSV = (obj: K8sResourceKind): boolean =>
  isCSV(obj) &&
  (obj.status?.reason === 'Copied' || Boolean(obj.metadata?.labels?.['olm.copiedFrom']));

export const isStandaloneCSV = (obj: K8sResourceKind): boolean =>
  isCSV(obj) &&
  (obj.metadata.annotations?.[OLMAnnotation.OperatorType] !== NON_STANDALONE_ANNOTATION_VALUE ||
    obj.status?.phase === ClusterServiceVersionPhase.CSVPhaseFailed);

export const clusterServiceVersionFor = (clusterServiceVersions: ClusterServiceVersionKind[]) => (
  subscription: SubscriptionKind,
): ClusterServiceVersionKind =>
  clusterServiceVersions?.find(
    (csv) =>
      csv?.metadata?.name &&
      subscription?.status?.installedCSV &&
      csv.metadata.name === subscription.status.installedCSV,
  );
