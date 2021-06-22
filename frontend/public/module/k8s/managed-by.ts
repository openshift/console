import { K8sResourceCommon, OwnerReference } from './';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { referenceForGroupVersionKind, referenceForOwnerRef, referenceFor } from './k8s';

// Check if owner is an Operand under csv
const isOwnedByOperator = (csv: ClusterServiceVersionKind, owner: OwnerReference) =>
  csv.spec?.customresourcedefinitions?.owned?.some((crd) => {
    const apiGroup = crd.name.substring(crd.name.indexOf('.') + 1);
    const crdGroupVersionKind = referenceForGroupVersionKind(apiGroup)(crd.version)(crd.kind);
    const ownerGroupVersionKind = referenceForOwnerRef(owner);
    return crdGroupVersionKind === ownerGroupVersionKind;
  });

// Check if csv === owner (there is no need to check namespace because ownerReferences must
// be in the same namespace as the owned resource, or be cluster-scoped).
const isOwnedByCSV = (csv: ClusterServiceVersionKind, owner: OwnerReference) => {
  const csvGroupVersionKind = referenceFor(csv);
  const ownerGroupVersionKind = referenceForOwnerRef(owner);
  return csvGroupVersionKind === ownerGroupVersionKind && csv.metadata.name === owner.name;
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
