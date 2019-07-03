import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getServicePort = (service: K8sResourceKind, targetPort: number) =>
  _.get(service, ['spec', 'ports'], []).find(
    (servicePort) => targetPort === servicePort.targetPort,
  );
