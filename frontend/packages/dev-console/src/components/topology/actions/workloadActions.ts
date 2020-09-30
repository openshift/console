import * as _ from 'lodash';
import { Kebab, KebabAction, KebabOption } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { menuActions as deploymentConfigMenuActions } from '@console/internal/components/deployment-config';
import { menuActions as deploymentMenuActions } from '@console/internal/components/deployment';
import { menuActions as statefulSetMenuActions } from '@console/internal/components/stateful-set';
import { menuActions as daemonSetMenuActions } from '@console/internal/components/daemon-set';
import { menuActions as cronJobActions } from '@console/internal/components/cron-job';
import { menuActions as jobActions } from '@console/internal/components/job';
import { menuActions as podActions } from '@console/internal/components/pod';
import { ModifyApplication } from '../../../actions/modify-application';
import { TopologyDataResources } from '../topology-types';

const defaultMenuForKind = (kind: string) => {
  const menuActions: KebabAction[] = [];
  const kindObject = modelFor(kind);
  const { common } = Kebab.factory;
  menuActions.push(...Kebab.getExtensionsActionsForKind(kindObject));
  menuActions.push(...common);

  return menuActions;
};
export const workloadActions = (
  contextMenuResource: K8sResourceKind,
  allowRegroup: boolean = true,
  resources?: TopologyDataResources,
  isOperatorBacked?: boolean,
): KebabOption[] => {
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
    case 'CronJob':
      menuActions.push(...cronJobActions);
      break;
    case 'Job':
      menuActions.push(...jobActions);
      break;
    case 'Pod':
      menuActions.push(...podActions);
      break;
    default:
      menuActions.push(...defaultMenuForKind(contextMenuResource.kind));
      break;
  }

  return _.map(menuActions, (a) =>
    a(modelFor(referenceFor(contextMenuResource)), contextMenuResource, resources, {
      isOperatorBacked,
    }),
  );
};
