import * as _ from 'lodash';
import { Kebab, KebabOption } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';

export const nodeActions = (contextMenuResource: K8sResourceKind): KebabOption[] => {
  if (!contextMenuResource) {
    return null;
  }
  const resourceKind = modelFor(referenceFor(contextMenuResource));
  const menuActions = [...Kebab.getExtensionsActionsForKind(resourceKind), ...Kebab.factory.common];

  return _.map(menuActions, (a) => a(resourceKind, contextMenuResource));
};
