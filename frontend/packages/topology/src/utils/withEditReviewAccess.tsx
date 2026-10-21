import type { FC } from 'react';
import { observer } from 'mobx-react';
import type {
  WithEditReviewAccess,
  WithEditReviewAccessComponentProps,
} from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { getResource } from './topology-utils';

export const withEditReviewAccess: WithEditReviewAccess = (verb) => (WrappedComponent) => {
  const Component: FC<WithEditReviewAccessComponentProps> = (props) => {
    const resourceObj = getResource(props.element);
    const resourceModel = modelFor(referenceFor(resourceObj));
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
