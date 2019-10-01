import { K8sResourceKind } from '@console/internal/module/k8s';
import { getOBCPhase } from '../selectors';

/** NooBaa issue currently no status is shown  */
export const isBound = (obc: K8sResourceKind): boolean => getOBCPhase(obc) === 'Bound';
