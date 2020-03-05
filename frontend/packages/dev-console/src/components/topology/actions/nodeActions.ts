import * as _ from 'lodash';
import { Kebab, KebabOption, mergePluginKebabOptions } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { KebabActionFactory } from '@console/plugin-sdk';
import { TopologyDataObject } from '../topology-types';
import { getTopologyResourceObject } from '../topology-utils';

export const nodeActions = (
  node: TopologyDataObject,
  actionExtensions: KebabActionFactory[],
): KebabOption[] => {
  const contextMenuResource = getTopologyResourceObject(node);
  if (!contextMenuResource) {
    return null;
  }

  const resourceKind = modelFor(referenceFor(contextMenuResource));
  const menuActions = [...Kebab.factory.common];
  const menuOptions = _.map(menuActions, (a) => a(resourceKind, contextMenuResource));

  return mergePluginKebabOptions(menuOptions, actionExtensions, resourceKind, contextMenuResource);
};
