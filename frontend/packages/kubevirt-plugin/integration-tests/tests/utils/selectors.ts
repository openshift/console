import { isEmpty } from 'lodash';
import { K8sKind } from '@console/internal/module/k8s/types';

// Duplicate of apiVersionForModel from '@console/internal/module/k8s/k8s'
// which causes errors when imported in integration-tests
export const apiVersionForModel = (model: K8sKind) =>
  isEmpty(model.apiGroup) ? model.apiVersion : `${model.apiGroup}/${model.apiVersion}`;
