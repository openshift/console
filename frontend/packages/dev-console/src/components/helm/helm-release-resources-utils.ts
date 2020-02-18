import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const flattenResources = (resources: { [kind: string]: { data: K8sResourceKind } }) =>
  Object.keys(resources).reduce((acc, kind) => {
    if (!_.isEmpty(resources[kind].data)) {
      acc.push(resources[kind].data);
    }
    return acc;
  }, []);
