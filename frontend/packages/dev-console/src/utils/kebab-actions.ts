import * as _ from 'lodash';
import { K8sKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { ModifyApplication } from '../actions/modify-application';

const modifyApplicationKinds = ['Deployment', 'DeploymentConfig', 'DaemonSet', 'StatefulSet'];

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (!resourceKind) {
    // no common actions
    return [];
  }

  return _.includes(modifyApplicationKinds, resourceKind.kind) ? [ModifyApplication] : [];
};
