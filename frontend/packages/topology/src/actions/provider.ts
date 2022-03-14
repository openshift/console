import { useMemo } from 'react';
import { Edge, GraphElement } from '@patternfly/react-topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { TYPE_WORKLOAD, TYPE_CONNECTS_TO } from '../const';
import { getResource } from '../utils';
import { DeleteConnectorAction, MoveConnectorAction } from './edgeActions';
import { getModifyApplicationAction } from './modify-application';

export const useTopologyWorkloadActionProvider = (element: GraphElement) => {
  const actions = useMemo(() => {
    if (element.getType() !== TYPE_WORKLOAD) return undefined;
    const resource = getResource(element);
    if (!resource) {
      return [];
    }
    const k8sKind = modelFor(referenceFor(resource));
    return [getModifyApplicationAction(k8sKind, resource)];
  }, [element]);

  return useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};

export const useTopologyVisualConnectorActionProvider = (element: Edge) => {
  const resource = getResource(element.getSource?.());
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource ?? {}));
  const actions = useMemo(() => {
    if (!kindObj || element.getType() !== TYPE_CONNECTS_TO) return undefined;
    return [MoveConnectorAction(kindObj, element), DeleteConnectorAction(kindObj, element)];
  }, [element, kindObj]);

  return useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, !inFlight, undefined];
  }, [actions, inFlight]);
};
