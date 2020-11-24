import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, modelFor } from '@console/internal/module/k8s';

type TopologyGroupResourceItemProps = {
  item: K8sResourceKind;
  releaseNamespace: string;
  linkForResource?: (obj: K8sResourceKind) => React.ReactElement;
};

const TopologyGroupResourceItem: React.FC<TopologyGroupResourceItemProps> = ({
  item,
  releaseNamespace,
  linkForResource,
}) => {
  const {
    metadata: { name, namespace },
  } = item;
  const kind = referenceFor(item);
  const model = modelFor(kind);
  const resourceNamespace = model.namespaced ? namespace || releaseNamespace : null;
  const link = linkForResource ? (
    linkForResource(item)
  ) : (
    <ResourceLink kind={kind} name={name} namespace={resourceNamespace} />
  );
  return (
    <li className="list-group-item container-fluid">
      <div className="row">
        <span className="col-xs-12">{link}</span>
      </div>
    </li>
  );
};

export default TopologyGroupResourceItem;
