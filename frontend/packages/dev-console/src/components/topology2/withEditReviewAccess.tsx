import * as React from 'react';
import { observer } from 'mobx-react';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { Node } from '@console/topology';
import { getTopologyResourceObject } from '../topology/topology-utils';

type ComponentProps = {
  element: Node;
};

export const withEditReviewAccess = () => (WrappedComponent: React.ComponentType) => {
  const Component: React.FC<ComponentProps> = (props) => {
    const resourceObj = getTopologyResourceObject(props.element.getData());
    const resourceModel = modelFor(referenceFor(resourceObj));
    const editAccess = useAccessReview({
      group: resourceModel.apiGroup,
      verb: 'patch',
      resource: resourceModel.plural,
      name: resourceObj.metadata.name,
      namespace: resourceObj.metadata.namespace,
    });
    return <WrappedComponent {...props as any} canEdit={editAccess} />;
  };
  return observer(Component);
};
