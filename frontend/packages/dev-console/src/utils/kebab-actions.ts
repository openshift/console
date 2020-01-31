import * as _ from 'lodash';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { ModifyApplication, EditApplication } from '../actions/modify-application';

const modifyApplicationRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
  referenceForModel(DaemonSetModel),
  referenceForModel(StatefulSetModel),
];

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (!resourceKind) {
    // no common actions
    return [];
  }

  return _.includes(modifyApplicationRefs, referenceForModel(resourceKind))
    ? [ModifyApplication, EditApplication]
    : [];
};
