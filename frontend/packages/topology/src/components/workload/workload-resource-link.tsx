import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { Link } from 'react-router-dom';
import { ResourceIcon, resourcePath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { TYPE_WORKLOAD } from '../../const';
import { getResource } from '../../utils';

export const getWorkloadResourceLink = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const resource = getResource(element as Node);
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
