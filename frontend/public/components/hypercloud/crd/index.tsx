// import * as React from 'react';
import * as _ from 'lodash';
import { K8sKind, CustomResourceDefinitionKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';

export const parseALMExamples = (crd: CustomResourceDefinitionKind) => {
  try {
    return JSON.parse(crd?.metadata?.annotations?.['alm-examples'] ?? '[]');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Unable to parse ALM expamples\n', e);
    return [];
  }
};

export const exampleForModel = (crd: CustomResourceDefinitionKind, model: K8sKind) => {
  const almObj = parseALMExamples(crd);
  return _.defaultsDeep(
    {},
    {
      kind: model.kind,
      apiVersion: model?.apiGroup ? `${model.apiGroup}/${model.apiVersion}` : `${model.apiVersion}`,
    },
    _.find(almObj, (s: CustomResourceDefinitionKind) => referenceFor(s) === referenceForModel(model)),
  );
};
