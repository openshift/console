import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { Link } from 'react-router-dom';
import { ResourceIcon, resourcePath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { getResource } from '@console/topology/src/utils';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '../components/const';

const KafkaConnectionPanelResourceLink = (element: GraphElement) => {
  if (element.getType() !== TYPE_MANAGED_KAFKA_CONNECTION) return undefined;
  const resource = getResource(element);
  const kindReference = referenceFor(resource);
  return (
    <>
      <ResourceIcon className="co-m-resource-icon--lg" kind={kindReference} />
      <Link
        to={resourcePath(kindReference, resource.metadata.name, resource.metadata.namespace)}
        className="co-resource-item__resource-name"
      >
        {resource.metadata.name}
      </Link>
    </>
  );
};

export default KafkaConnectionPanelResourceLink;
