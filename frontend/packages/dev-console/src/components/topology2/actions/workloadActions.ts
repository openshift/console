import * as _ from 'lodash';
import { KebabAction, KebabOption } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { menuActions as deploymentConfigMenuActions } from '@console/internal/components/deployment-config';
import { menuActions as deploymentMenuActions } from '@console/internal/components/deployment';
import { menuActions as statefulSetMenuActions } from '@console/internal/components/stateful-set';
import { menuActions as daemonSetMenuActions } from '@console/internal/components/daemon-set';
import { TopologyDataObject } from '../topology-types';
import { getTopologyResourceObject } from '../topology-utils';

export const workloadActions = (workload: TopologyDataObject): KebabOption[] => {
  const contextMenuResource = getTopologyResourceObject(workload);
  if (!contextMenuResource) {
    return null;
  }

  let menuActions: KebabAction[];
  switch (contextMenuResource.kind) {
    case 'DeploymentConfig':
      menuActions = deploymentConfigMenuActions;
      break;
    case 'Deployment':
      menuActions = deploymentMenuActions;
      break;
    case 'StatefulSet':
      menuActions = statefulSetMenuActions;
      break;
    case 'DaemonSet':
      menuActions = daemonSetMenuActions;
      break;
    default:
      menuActions = [];
  }

  return _.map(menuActions, (a) =>
    a(modelFor(referenceFor(contextMenuResource)), contextMenuResource),
  );
};
