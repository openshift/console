import * as _ from 'lodash';
import { KebabAction, KebabOption } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { menuActions as deploymentConfigMenuActions } from '@console/internal/components/deployment-config';
import { menuActions as deploymentMenuActions } from '@console/internal/components/deployment';
import { menuActions as statefulSetMenuActions } from '@console/internal/components/stateful-set';
import { menuActions as daemonSetMenuActions } from '@console/internal/components/daemon-set';
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
  switch (contextMenuResource.kind) {
    case 'DeploymentConfig':
      menuActions.push(...deploymentConfigMenuActions);
      break;
    case 'Deployment':
      menuActions.push(...deploymentMenuActions);
      break;
    case 'StatefulSet':
      menuActions.push(...statefulSetMenuActions);
      break;
    case 'DaemonSet':
      menuActions.push(...daemonSetMenuActions);
      break;
    default:
      break;
  }

  return _.map(menuActions, (a) =>
    a(modelFor(referenceFor(contextMenuResource)), contextMenuResource),
  );
};
