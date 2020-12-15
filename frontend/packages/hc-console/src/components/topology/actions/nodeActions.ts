import * as _ from 'lodash';
import { Kebab, KebabOption } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { TopologyDataObject } from '../topology-types';
import { getTopologyResourceObject } from '../topology-utils';

export const nodeActions = (node: TopologyDataObject): KebabOption[] => {
  const contextMenuResource = getTopologyResourceObject(node);
  if (!contextMenuResource) {
    return null;
  }
  const resourceKind = modelFor(referenceFor(contextMenuResource));
  const menuActions = [...Kebab.getExtensionsActionsForKind(resourceKind), ...Kebab.factory.common];

  return _.map(menuActions, (a) => a(resourceKind, contextMenuResource));
};
