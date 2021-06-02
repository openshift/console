import * as _ from 'lodash';
import { KebabAction } from '@console/internal/components/utils';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { EditApplication } from '@console/topology/src/actions/modify-application';

const modifyWebConsoleApplicationRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
  referenceForModel(DaemonSetModel),
  referenceForModel(StatefulSetModel),
];

const editApplicationRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
];

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (!resourceKind) {
    // no common actions
    return [];
  }

  return _.includes(modifyWebConsoleApplicationRefs, referenceForModel(resourceKind))
    ? [
        ...(_.includes(editApplicationRefs, referenceForModel(resourceKind))
          ? [EditApplication]
          : []),
      ]
    : [];
};
