import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { Link } from 'react-router-dom-v5-compat';
import { ResourceIcon, resourcePath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { getResource } from '../../utils';

export const getWorkloadResourceLink = (element: GraphElement) => {
  const resource = getResource(element);
  if (!resource) {
    return null;
  }
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
