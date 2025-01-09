import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { K8sKind, K8sVerb, useAccessReview } from '../lib-core';
import { getResource } from './utils';

type ComponentProps = {
  element: Node;
  resourceModel: K8sKind;
};

export const withEditReviewAccess = (verb: K8sVerb) => (
  WrappedComponent: React.ComponentType,
  resourceModel: K8sKind,
) => {
  const Component: React.FC<ComponentProps> = (props) => {
    const resourceObj = getResource(props.element);
    const editAccess = useAccessReview({
      group: resourceModel.apiGroup,
      verb,
      resource: resourceModel.plural,
      name: resourceObj.metadata.name,
      namespace: resourceObj.metadata.namespace,
    });
    return <WrappedComponent {...(props as any)} canEdit={editAccess} />;
  };
  Component.displayName = `withEditReviewAccess(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return observer(Component);
};
