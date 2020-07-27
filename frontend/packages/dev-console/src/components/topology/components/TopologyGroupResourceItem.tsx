import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, modelFor } from '@console/internal/module/k8s';

type TopologyGroupResourceItemProps = {
  item: K8sResourceKind;
  releaseNamespace: string;
};

const TopologyGroupResourceItem: React.FC<TopologyGroupResourceItemProps> = ({
  item,
  releaseNamespace,
}) => {
  const {
    metadata: { name, namespace },
  } = item;
  const kind = referenceFor(item);
  const model = modelFor(kind);
  const resourceNamespace = model.namespaced ? namespace || releaseNamespace : null;

  return (
    <li className="list-group-item container-fluid">
      <div className="row">
        <span className="col-xs-12">
          <ResourceLink kind={kind} name={name} namespace={resourceNamespace} />
        </span>
      </div>
    </li>
  );
};

export default TopologyGroupResourceItem;
