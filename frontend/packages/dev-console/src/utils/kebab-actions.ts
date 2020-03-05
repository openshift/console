import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { GetKebabActions } from '@console/plugin-sdk';
import { ModifyApplication, EditApplication } from '../actions/modify-application';

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

export const getKebabActions: GetKebabActions = (resourceKind) => {
  if (!resourceKind) {
    // no common actions
    return [];
  }

  return _.includes(modifyWebConsoleApplicationRefs, referenceForModel(resourceKind))
    ? [
        ModifyApplication,
        ...(_.includes(editApplicationRefs, referenceForModel(resourceKind))
          ? [EditApplication]
          : []),
      ]
    : [];
};
