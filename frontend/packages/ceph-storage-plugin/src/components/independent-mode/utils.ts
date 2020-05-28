import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { getAnnotations } from '@console/shared';

const pluralize = (count: number, singular: string, plural: string = `${singular}s`): string =>
  count > 1 ? plural : singular;

export const isValidJSON = (fData: string): boolean => {
  try {
    JSON.parse(fData);
    return true;
  } catch (e) {
    return false;
  }
};

export const createDownloadFile = (data: string): string =>
  `data:application/octet-stream;charset=utf-8,${encodeURIComponent(Base64.decode(data))}`;

export const checkError = (
  data: string = '{}',
  requiredKeys = [],
  requiresEncodingKeys = [],
): string => {
  const parsedData = JSON.parse(data);
  const providedKeys = _.map(parsedData, (item) => item.name);
  const emptyKeys = [];
  const base64ErrorKeys = [];
  _.map(parsedData, (item) => {
    if (_.isEmpty(item.data)) emptyKeys.push(item.name ?? 'Unrecongnized key');
    if (requiresEncodingKeys.includes(item.name)) {
      _.isEmpty(item.data?.userKey) &&
        _.isEmpty(item.data?.adminKey) &&
        base64ErrorKeys.push(item.name ?? 'Unrecognized key');
      try {
        atob(item.data?.userKey ?? item.data?.adminKey);
      } catch (e) {
        base64ErrorKeys.push(item.name ?? 'Unrecognized key');
      }
    }
  });

  // Check for missing keys
  const missingKeys = _.difference(_.concat(requiredKeys, requiresEncodingKeys), providedKeys);
  if (missingKeys.length > 0 && providedKeys.length > 0) {
    return `${_.uniq(missingKeys).join(', ')} ${pluralize(
      _.uniq(missingKeys).length,
      'is',
      'are',
    )} missing.`;
  }

  if (emptyKeys.length > 0) {
    return `${_.uniq(emptyKeys).join(', ')} ${pluralize(
      emptyKeys.length,
      'has',
      'have',
    )} empty ${pluralize(emptyKeys.length, 'value')}.`;
  }

  if (base64ErrorKeys.length > 0) {
    return `${_.uniq(base64ErrorKeys).join(', ')} ${pluralize(
      base64ErrorKeys.length,
      'key',
    )} ${pluralize(base64ErrorKeys.length, 'has', 'have')} malformed Base64 encoding ${pluralize(
      base64ErrorKeys.length,
      'value',
    )}.`;
  }
  return '';
};

export const getRequiredKeys = (csv: ClusterServiceVersionKind): { [key: string]: string[] } => {
  // external.ocs.openshift.io/validation: '{"configMaps":["x", "y"], "secrets": ["x", "y", "z"], "storageClasses": ["x"]}'
  const keys = getAnnotations(csv)?.['external.features.ocs.openshift.io/validation'] ?? '{}';
  return JSON.parse(keys);
};

enum ClusterPhase {
  CONNECTED = 'Connected',
  READY = 'Ready',
  CONNECTING = 'Connecting',
  PROGRESSING = 'Progressing',
  ERROR = 'Error',
}

const PhaseToState = Object.freeze({
  [ClusterPhase.CONNECTED]: HealthState.OK,
  [ClusterPhase.READY]: HealthState.OK,
  [ClusterPhase.CONNECTING]: HealthState.UPDATING,
  [ClusterPhase.PROGRESSING]: HealthState.UPDATING,
  [ClusterPhase.ERROR]: HealthState.ERROR,
});

export const getClusterHealth = (cluster: K8sResourceKind, loaded: boolean, error): HealthState => {
  const phase = cluster?.status?.phase;
  if (!_.isEmpty(error)) {
    if (error?.response?.status === 404) return HealthState.NOT_AVAILABLE;
    return HealthState.ERROR;
  }
  if (!loaded) return HealthState.LOADING;
  if (!_.isEmpty(cluster)) return PhaseToState[phase];
  return HealthState.NOT_AVAILABLE;
};

export const prettifyJSON = (data: string) =>
  _.isEmpty(data)
    ? ''
    : (() => {
        const jsonData = JSON.parse(data);
        let container = ``;
        _.map(
          jsonData,
          (item) =>
            (container += `${_.upperCase(item.name ?? 'Unrecognized key')} = ${
              item.data ? JSON.stringify(item.data) : 'Unrecognized value'
            }\n`),
        );
        return container;
      })();
