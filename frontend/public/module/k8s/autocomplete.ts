/* eslint-disable no-undef, no-unused-vars */

import { IEditSession, Editor, Position } from 'brace';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { ServiceAccountModel, SecretModel, ServiceModel, ConfigMapModel } from '../../models';
import { K8sKind, K8sResourceKind } from '../../module/k8s';
import { k8sList } from '../../module/k8s/resource';

/**
 * Defines a bunch of possibilities for property value completion, defined in the OpenAPI/Swagger spec.
 */
export const simpleCompletions = ImmutableMap<string, string[]>()
  .set('imagePullPolicy', ['Always', 'IfNotPresent', 'Never'])
  .set('restartPolicy', ['Always', 'OnFailure', 'Never'])
  .set('terminationMessagePolicy', ['File', 'FallbackToLogsOnError'])
  .set('terminationMessagePath', ['/dev/termination-log'])
  .set('dnsPolicy', ['ClusterFirstWithHostNet', 'ClusterFirst', 'Default', 'None'])
  // FIXME: `type` is too generic, should figure out how to detect nested properties
  .set('type', ['RollingUpdate', 'Recreate'] // Deployment.spec.strategy.type
    .concat(['ClusterIP', 'LoadBalancer', 'None']) // Service.spec.type
    .concat(['Opaque']) // Secret.type
  )
  .set('sessionAffinity', ['ClientIP', 'None'])
  .set('protocol', ['TCP', 'UDP'])
  .set('readOnly', ['true', 'false'])
  .set('persistentVolumeReclaimPolicy', ['Retain', 'Recycle'])
  .set('reclaimPolicy', ['Delete', 'Retain'])
  .set('concurrencyPolicy', ['Allow', 'Forbid', 'Replace'])
  .set('suspend', ['true', 'false'])
  .set('fieldRef', ['metadata.name', 'metadata.namespace', 'metadata.labels', 'metadata.annotations', 'spec.nodeName', 'spec.serviceAccountName', 'status.hostIP', 'status.podIP'])
  .set('resourceFieldRef', ['limits.cpu', 'limits.memory', 'limits.ephemeral-storage', 'requests.cpu', 'requests.memory', 'requests.ephemeral-storage']);

export const clusterStateCompletions = ImmutableMap<string, K8sKind>()
  .set('serviceAccount', ServiceAccountModel)
  .set('serviceName', ServiceModel)
  .set('imagePullSecrets', SecretModel)
  .set('configMapKeyRef', ConfigMapModel)
  .set('secretKeyRef', SecretModel)
  .set('secretName', SecretModel)
  .set('secrets', SecretModel)
  .set('serviceAccountName', ServiceAccountModel)
  .set('additionalScrapeConfigs', SecretModel)
  .set('configMapName', ConfigMapModel)
  .set('clientTLSSecret', SecretModel)
  .set('awsSecret', SecretModel)
  .set('absSecret', SecretModel);

export const getPropertyCompletions = async(state: Editor, session: IEditSession, pos: Position, prefix: string, callback: CompletionCallback) => {
  const valueFor = (property: string) => session.getLines(0, session.getLength()).reduce((foundKind, cur) => {
    return foundKind.length || !cur.startsWith(`${property}: `) ? foundKind : cur.slice(`${property}: `.length - cur.length);
  }, '');

  const kind = valueFor('kind');
  const apiVersion = valueFor('apiVersion');
  const swagger: SwaggerAPISpec = JSON.parse(window.localStorage.getItem('swagger.json'));

  if (kind.length && apiVersion.length && swagger) {
    const defKey = Object.keys(swagger.definitions).find(key => key.endsWith(`${apiVersion.replace('/', '.')}.${kind}`));
    const results = Object.keys(_.get(swagger.definitions, [`${defKey}Spec`, 'properties'], {})).map(prop => ({
      name: prop,
      score: 10000,
      value: prop,
      meta: kind,
    }));
    callback(null, results);
  }
};

/**
 * Provides completion using either static values derived from k8s API spec, or by fetching cluster resources.
 */
export const getPropertyValueCompletions = async(state: Editor, session: IEditSession, pos: Position, prefix: string, callback: CompletionCallback) => {
  const line = session.getLine(pos.row).substr(0, pos.column);
  const field = (/([\w]+):[^:]*$/.exec(line) || {})[1];

  const parentPropertyFor = (currentRow: number): string => session.getLine(currentRow - 1).trim().endsWith(':')
    ? (/([\w]+):[^:]*$/.exec(session.getLine(currentRow - 1)) || {})[1]
    : parentPropertyFor(currentRow - 1);

  if (simpleCompletions.has(field)) {
    callback(null, simpleCompletions.get(field).map((value, i) => ({
      name: value,
      score: 10000 + i,
      value,
      meta: field,
    })));
  } else if (clusterStateCompletions.has(field)) {
    const results = (await k8sList(clusterStateCompletions.get(field)) as K8sResourceKind[]).map(obj => ({
      name: obj.metadata.name,
      score: 10000,
      value: obj.metadata.name,
      meta: clusterStateCompletions.get(field).kind,
    }));
    callback(null, results);
  } else if (clusterStateCompletions.has(parentPropertyFor(pos.row))) {
    const results = (await k8sList(clusterStateCompletions.get(parentPropertyFor(pos.row))) as K8sResourceKind[]).map(obj => ({
      name: obj.metadata.name,
      score: 10000,
      value: obj.metadata.name,
      meta: clusterStateCompletions.get(parentPropertyFor(pos.row)).kind,
    }));
    callback(null, results);
  }
};

export const getCompletions: Completer['getCompletions'] = (editor, session, pos, prefix, callback) => {
  const line = session.getLine(pos.row).substr(0, pos.column);

  if (/:[^;]+$/.test(line) || line.trim().startsWith('-')) {
    getPropertyValueCompletions(editor, session, pos, prefix, callback);
  } else {
    getPropertyCompletions(editor, session, pos, prefix, callback);
  }
};

export type SwaggerAPISpec = {
  swagger: string;
  info: {title: string, version: string};
  paths: {[path: string]: any};
  definitions: {[name: string]: {
    description: string;
    properties: {[prop: string]: {description: string, type: string}};
  }};
};

// TODO: Remove once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/25337 is merged
export type Completer = {
  getCompletions: (editor: Editor, session: IEditSession, pos: Position, prefix: string, callback: CompletionCallback) => void;
  getDocTooltip?: (item: Completion) => void;
};

export type Completion = {
  value: string;
  meta: string;
  type?: string;
  caption?: string;
  snippet?: any;
  score?: number;
  exactMatch?: number;
  docHTML?: string;
};

export type CompletionCallback = (error: Error, results: Completion[]) => void;
