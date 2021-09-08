import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getModifyApplicationAction } from '@console/topology/src/actions/modify-application';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { AddBrokerAction } from './add-broker';
import { AddChannelAction } from './add-channel';
import { AddEventSourceAction } from './add-event-source';
import { addSubscriptionChannel, addTriggerBroker, moveSinkPubsub } from './creators';
import { hideKnatifyAction, MakeServerless } from './knatify';

export const useMakeServerlessActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const deploymentActions = React.useMemo(() => {
    return hideKnatifyAction(resource) ? [] : MakeServerless(kindObj, resource);
  }, [kindObj, resource]);

  return [deploymentActions, !inFlight, undefined];
};

export const useSinkPubSubActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    return [moveSinkPubsub(kindObj, resource), ...getCommonResourceActions(kindObj, resource)];
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const useBrokerActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    return [
      getModifyApplicationAction(kindObj, resource),
      addTriggerBroker(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ];
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const useChannelActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    return [
      getModifyApplicationAction(kindObj, resource),
      addSubscriptionChannel(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ];
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const useAddToApplicationActionProvider = (element: GraphElement) => {
  const [namespace] = useActiveNamespace();
  const actions = React.useMemo(() => {
    if (element.getType() !== TYPE_APPLICATION_GROUP) return undefined;
    const label = element.getLabel();
    return [
      AddEventSourceAction(namespace, label, undefined, 'add-to-application'),
      AddChannelAction(namespace, label, 'add-to-application'),
      AddBrokerAction(namespace, label, 'add-to-application'),
    ];
  }, [element, namespace]);
  return React.useMemo(() => {
    if (actions) {
      return [actions, true, undefined];
    }
    return [[], true, undefined];
  }, [actions]);
};
