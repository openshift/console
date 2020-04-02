import * as React from 'react';
import * as _ from 'lodash-es';
import { K8sResourceKind, OwnerReference, referenceForOwnerRef } from '../../module/k8s';
import { ResourceLink } from './resource-link';

export const OwnerReferences: React.FC<OwnerReferencesProps> = ({ resource }) => {
  const owners = (_.get(resource.metadata, 'ownerReferences') || []).map((o: OwnerReference) => (
    <ResourceLink
      key={o.uid}
      kind={referenceForOwnerRef(o)}
      name={o.name}
      namespace={resource.metadata.namespace}
    />
  ));
  return owners.length ? <>{owners}</> : <span className="text-muted">No owner</span>;
};

type OwnerReferencesProps = {
  resource: K8sResourceKind;
};

OwnerReferences.displayName = 'OwnerReferences';
