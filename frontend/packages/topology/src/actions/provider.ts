import { useMemo } from 'react';
import { Edge, GraphElement } from '@patternfly/react-topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { TYPE_WORKLOAD, TYPE_CONNECTS_TO } from '../const';
import { getResource } from '../utils';
import { DeleteConnectorAction, useMoveConnectorAction } from './edgeActions';
import { useGetModifyApplicationAction } from './modify-application';

export const useTopologyWorkloadActionProvider = (element: GraphElement) => {
  const resource = getResource(element);
  const k8sKind = resource ? modelFor(referenceFor(resource)) : null;
  const getModifyApplicationAction = useGetModifyApplicationAction(k8sKind, resource);
  const actions = useMemo(() => {
    if (element.getType() !== TYPE_WORKLOAD) return undefined;
    if (!resource) {
      return [];
    }
    return [getModifyApplicationAction];
  }, [element, getModifyApplicationAction, resource]);

  return useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};

export const useTopologyVisualConnectorActionProvider = (element: Edge) => {
  const resource = getResource(element.getSource?.());
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource ?? {}));
  const moveConnectionAction = useMoveConnectorAction(kindObj, element);
  const actions = useMemo(() => {
    if (!kindObj || element.getType() !== TYPE_CONNECTS_TO) return undefined;
    return [moveConnectionAction, DeleteConnectorAction(kindObj, element)];
  }, [element, kindObj, moveConnectionAction]);

  return useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, !inFlight, undefined];
  }, [actions, inFlight]);
};
