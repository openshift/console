import { K8sResourceCommon, OwnerReference, groupVersionFor } from './';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager';

// Check if owner is an Operand under csv
const isOwnedByOperator = (csv: ClusterServiceVersionKind, owner: OwnerReference) => {
  const { group } = groupVersionFor(owner.apiVersion);
  return csv.spec?.customresourcedefinitions?.owned?.some((owned) => {
    const ownedGroup = owned.name.substring(owned.name.indexOf('.') + 1);
    return owned.kind === owner.kind && ownedGroup === group;
  });
};

// Check if csv === owner (there is no need to check namespace because ownerReferences must
// be in the same namespace as the owned resource, or be cluster-scoped).
const isOwnedByCSV = (csv: ClusterServiceVersionKind, owner: OwnerReference) => {
  const { group } = groupVersionFor(owner.apiVersion);
  return (
    group === ClusterServiceVersionModel.apiGroup &&
    owner.kind === ClusterServiceVersionModel.kind &&
    csv.metadata.name === owner.name
  );
};

// Find an Operator CSV that either is the owner or owns the owner
export const matchOwnerAndCSV = (owner: OwnerReference, csvs: ClusterServiceVersionKind[] = []) => {
  return csvs.find((csv) => isOwnedByOperator(csv, owner) || isOwnedByCSV(csv, owner));
};

// Find onwerReference that is either a CSV or is an Operand managed by a CSV.
export const findOwner = (obj: K8sResourceCommon, csvs: ClusterServiceVersionKind[]) => {
  return obj?.metadata?.ownerReferences?.find((o) =>
    csvs?.some((csv) => isOwnedByOperator(csv, o) || isOwnedByCSV(csv, o)),
  );
};
