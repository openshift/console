import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getMigrationStatusPhase = (value: K8sResourceKind) =>
  _.get(value, 'status.phase') as K8sResourceKind['status']['phase'];

export const hasMigrationStatus = (migration: K8sResourceKind, status) => {
  const phase = getMigrationStatusPhase(migration);
  return phase && phase.toLowerCase() === status.toLowerCase();
};

export const isMigrating = (migration: K8sResourceKind) =>
  migration &&
  !hasMigrationStatus(migration, 'succeeded') &&
  !hasMigrationStatus(migration, 'failed');

export const getMigrationVMIName = (migration: K8sResourceKind) => _.get(migration, 'spec.vmiName');
