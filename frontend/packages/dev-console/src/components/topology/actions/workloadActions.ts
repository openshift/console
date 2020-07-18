import * as _ from 'lodash';
import { Kebab, KebabAction, KebabOption } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { ModifyApplication } from '../../../actions/modify-application';

export const workloadActions = (
  contextMenuResource: K8sResourceKind,
  allowRegroup: boolean = true,
): KebabOption[] => {
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
