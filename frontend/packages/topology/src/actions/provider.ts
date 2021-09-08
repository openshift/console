import { useMemo } from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { TYPE_APPLICATION_GROUP, TYPE_WORKLOAD } from '../const';
import { getResource } from '../utils';
import { DeleteApplicationAction } from './groupActions';
import { getModifyApplicationAction } from './modify-application';

export const useTopologyWorloadActionProvider = (element: GraphElement) => {
  const actions = useMemo(() => {
    if (element.getType() !== TYPE_WORKLOAD) return undefined;
    const resource = getResource(element);
    const k8sKind = modelFor(referenceFor(resource));
    return [getModifyApplicationAction(k8sKind, resource)];
  }, [element]);

  return useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};

export const useApplicationPanelActionProvider = (element: GraphElement) => {
  const actions = useMemo(() => {
    if (element.getType() !== TYPE_APPLICATION_GROUP) return undefined;
    return [
      DeleteApplicationAction({
        id: element.getId(),
        name: element.getLabel(),
        resources: element.getData()?.groupResources,
      }),
    ];
  }, [element]);

  return useMemo(() => {
    if (actions) {
      return [actions, true, undefined];
    }
    return [[], true, undefined];
  }, [actions]);
};
