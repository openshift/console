import * as _ from 'lodash';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';

export const isActivity = (resource: K8sResourceKind) =>
  _.get(resource.status, 'phase') === 'Running';

export const getTimestamp = (resource: K8sResourceKind) =>
  new Date(resource.metadata.creationTimestamp);
