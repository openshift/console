import * as _ from 'lodash';
import { K8sKind, referenceFor } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  ServiceModel,
  StatefulSetModel,
} from '@console/internal/models';
import { ModifyApplication, EditApplication } from '../actions/modify-application';

const modifyApplicationRefs = [
  referenceFor(DeploymentConfigModel),
  referenceFor(DeploymentModel),
  referenceFor(DaemonSetModel),
  referenceFor(StatefulSetModel),
  referenceFor(ServiceModel),
];

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (!resourceKind) {
    // no common actions
    return [];
  }

  return _.includes(modifyApplicationRefs, referenceFor(resourceKind))
    ? [ModifyApplication, EditApplication]
    : [];
};
