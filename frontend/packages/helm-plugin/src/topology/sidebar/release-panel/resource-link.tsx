import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { Link } from 'react-router-dom';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { getResource } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE } from '../../components/const';

const helmReleasePanelResourceLink = (element: GraphElement) => {
  if (element.getType() !== TYPE_HELM_RELEASE) return undefined;
  const name = element.getLabel();
  const { namespace } = getResource(element as Node).metadata;
  return (
    <>
      <ResourceIcon className="co-m-resource-icon--lg" kind="HelmRelease" />
      {name && (
        <Link
          to={`/helm-releases/ns/${namespace}/release/${name}`}
          className="co-resource-item__resource-name"
        >
          {name}
        </Link>
      )}
    </>
  );
};

export default helmReleasePanelResourceLink;
