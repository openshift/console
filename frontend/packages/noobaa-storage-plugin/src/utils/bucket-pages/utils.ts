import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getOBPhase = (ob: K8sResourceKind): string => {
  const phase: string = _.get(ob, 'status.phase');
  return phase ? phase.charAt(0).toUpperCase() + phase.substring(1) : 'Lost';
};

export const getOBCPhase = (obc: K8sResourceKind): string => {
  const phase: string = _.get(obc, 'status.Phase');
  return phase ? phase.charAt(0).toUpperCase() + phase.substring(1) : 'Lost';
};

/** NooBaa issue currently no status is shown  */
export const isBound = (obc: K8sResourceKind): boolean => getOBCPhase(obc) === 'Bound';
