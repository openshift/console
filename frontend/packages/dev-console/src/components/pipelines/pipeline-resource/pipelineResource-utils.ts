import * as _ from 'lodash';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { PipelineResourceModel } from '../../../models';

export interface ParamData {
  [key: string]: any;
}

export const getRandomChars = (digit = 6): string => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/g, '')
    .substr(1, digit);
};

export const getDefinedObj = (objData: ParamData): ParamData => {
  return _.omitBy(objData, (v) => _.isUndefined(v) || _.isNull(v) || v === '');
};

export const createPipelineResource = (
  params: ParamData,
  type: string,
  namespace: string,
  secretResp?: K8sResourceKind,
): Promise<K8sResourceKind> => {
  const resourceName = `${type}-${getRandomChars(6)}`;
  const pipelineResource: K8sResourceKind = {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: PipelineResourceModel.kind,
    metadata: {
      name: resourceName,
      namespace,
    },
    spec: {
      type,
      params: _.map(getDefinedObj(params), (value, name) => ({ name, value })),
      ...(secretResp && {
        secrets: _.map(secretResp.data, (value, name) => {
          return {
            fieldName: name,
            secretKey: name,
            secretName: secretResp.metadata.name,
          };
        }),
      }),
    },
  };

  return k8sCreate(PipelineResourceModel, pipelineResource);
};

export const createSecretResource = (
  secret: ParamData,
  type: string,
  namespace: string,
): Promise<K8sResourceKind> => {
  const resourceName = `${type}-secret-${getRandomChars(6)}`;
  const secretResource = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: resourceName,
      namespace,
    },
    stringData: getDefinedObj(secret),
  };
  return k8sCreate(SecretModel, secretResource);
};
