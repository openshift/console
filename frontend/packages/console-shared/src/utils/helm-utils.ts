import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const isHelmResource = (resource: K8sResourceKind): boolean =>
  resource?.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'Helm' ||
  resource?.metadata?.labels?.['heritage'] === 'Helm' ||
  _.has(resource?.metadata?.labels, 'helm.sh/chart');
