import * as _ from 'lodash';
import { Kebab, KebabAction, KebabOption } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { ModifyApplication } from '../../../actions/modify-application';
import { TopologyDataObject } from '../topology-types';
import { getTopologyResourceObject } from '../topology-utils';

export const workloadActions = (
  workload: TopologyDataObject,
  allowRegroup: boolean = true,
): KebabOption[] => {
  const contextMenuResource = getTopologyResourceObject(workload);
  if (!contextMenuResource) {
    return null;
  }

  const menuActions: KebabAction[] = [];
  if (allowRegroup) {
    menuActions.push(ModifyApplication);
  }

  const kindObject = modelFor(contextMenuResource.kind);
  const { common } = Kebab.factory;
  menuActions.push(...Kebab.getExtensionsActionsForKind(kindObject));
  menuActions.push(...common);

  return _.map(menuActions, (a) =>
    a(modelFor(referenceFor(contextMenuResource)), contextMenuResource),
  );
};
