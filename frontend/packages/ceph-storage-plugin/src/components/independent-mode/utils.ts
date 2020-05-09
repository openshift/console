import * as _ from 'lodash';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { DataValidator, DataState, ErrorType, Field } from './types';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getValidJSON: DataValidator = (fData) => {
  try {
    // Just see if it fails
    const parsedData = JSON.parse(fData);
    return { isValid: true, parsedData };
  } catch (e) {
    return { isValid: false, errorMessage: 'File is not a valid JSON file.' };
  }
};

export const checkError = (data: DataState): ErrorType[] => {
  const errors: ErrorType[] = [];
  for (const key in data) {
    if (!_.isNull(data[key]) && _.isEmpty(_.trim(data[key])))
      errors.push({ field: key as Field, message: `${key} cannot be empty` });
    else errors.push({ field: key as Field, message: '' });
  }
  return errors;
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
