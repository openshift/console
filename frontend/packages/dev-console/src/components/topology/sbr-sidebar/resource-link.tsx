import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ResourceIcon, ResourceLink } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { TYPE_SERVICE_BINDING } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';

export const getSbrPanelResourceLink = (element: GraphElement) => {
  if (element.getType() !== TYPE_SERVICE_BINDING) return undefined;
  const resource = getResource(element);
  return (
    <>
      <ResourceIcon kind={resource.kind} />
      <ResourceLink
        kind={referenceFor(resource)}
        name={resource.metadata.name}
        namespace={resource.metadata.namespace}
        hideIcon
      />
    </>
  );
};
