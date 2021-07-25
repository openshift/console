import * as _ from 'lodash';
import { GroupVersionKind } from '@console/dynamic-plugin-sdk/src';
import { K8sKind } from '@console/dynamic-plugin-sdk/src/api/common-types';

// TODO(alecmerdler): Replace all manual string building with this function
export const referenceForGroupVersionKind = (group: string) => (version: string) => (
  kind: string,
) => [group, version, kind].join('~');

export const referenceForModel = (model: K8sKind): GroupVersionKind =>
  referenceForGroupVersionKind(model.apiGroup || 'core')(model.apiVersion)(model.kind);

export const apiVersionForModel = (model: K8sKind) =>
  _.isEmpty(model.apiGroup) ? model.apiVersion : `${model.apiGroup}/${model.apiVersion}`;
