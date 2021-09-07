import { useMemo } from 'react';
import { GraphElement, isNode } from '@patternfly/react-topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { getResource } from '../utils';
import { getModifyApplicationAction } from './modify-application';

export const useTopologyWorloadActionProvider = (element: GraphElement) => {
  const actions = useMemo(() => {
    if (element.getType() !== TYPE_WORKLOAD) return [];
    const resource = getResource(element);
    const k8sKind = modelFor(referenceFor(resource));
    return [getModifyApplicationAction(k8sKind, resource)];
  }, [element]);

  return useMemo(() => {
    if (!isNode(element)) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions, element]);
};
