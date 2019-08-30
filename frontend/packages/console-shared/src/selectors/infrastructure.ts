import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getInfrastructurePlatform = (infrastructure: K8sResourceKind): string =>
  _.get(infrastructure, 'status.platform');
