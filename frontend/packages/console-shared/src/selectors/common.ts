import * as _ from 'lodash';

import { K8sResourceKind } from '@console/internal/module/k8s';

export const getName = (value: K8sResourceKind): string => _.get(value, 'metadata.name');
export const getNamespace = (value: K8sResourceKind): string => _.get(value, 'metadata.namespace');
