import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const getRequester = (obj: K8sResourceKind): string =>
  _.get(obj, ['metadata', 'annotations', 'openshift.io/requester']);
