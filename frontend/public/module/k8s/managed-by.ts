import { groupVersionFor, K8sResourceCommon, OwnerReference } from './';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';

const isOwnedByOperator = (csv: ClusterServiceVersionKind, owner: OwnerReference) => {
  const { group } = groupVersionFor(owner.apiVersion);
  return csv.spec?.customresourcedefinitions?.owned?.some((owned) => {
    const ownedGroup = owned.name.substring(owned.name.indexOf('.') + 1);
    return owned.kind === owner.kind && ownedGroup === group;
  });
};

export const matchOwnerAndCSV = (owner: OwnerReference, csvs: ClusterServiceVersionKind[] = []) => {
  return csvs.find((csv) => isOwnedByOperator(csv, owner));
};

export const findOwner = (obj: K8sResourceCommon, data: ClusterServiceVersionKind[]) => {
  return obj?.metadata?.ownerReferences?.find((o) =>
    data?.some((csv) => isOwnedByOperator(csv, o)),
  );
};
