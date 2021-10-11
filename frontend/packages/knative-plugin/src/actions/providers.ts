import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { DeploymentActionFactory } from '@console/app/src/actions/creators/deployment-factory';
import { getHealthChecksAction } from '@console/app/src/actions/creators/health-checks-factory';
import { Action } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, referenceFor, modelFor } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getModifyApplicationAction } from '@console/topology/src/actions/modify-application';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { RevisionModel } from '../models';
import { TYPE_KNATIVE_SERVICE, TYPE_EVENT_PUB_SUB } from '../topology/const';
import { AddBrokerAction } from './add-broker';
import { AddChannelAction } from './add-channel';
import { AddEventSourceAction } from './add-event-source';
import {
  addSubscriptionChannel,
  addTriggerBroker,
  moveSinkPubsub,
  deleteRevision,
  editKnativeService,
  setTrafficDistribution,
} from './creators';
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

export const useKnativeServiceActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    return [
      setTrafficDistribution(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      editKnativeService(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ];
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const useBrokerActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    return [addTriggerBroker(kindObj, resource), ...getCommonResourceActions(kindObj, resource)];
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const useCommonActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    let commonActions = getCommonResourceActions(kindObj, resource);
    if (
      resource.kind === RevisionModel.kind &&
      commonActions.findIndex((action: Action) => action.id === 'delete-resource')
    ) {
      commonActions = commonActions.filter((action: Action) => action.id !== 'delete-resource');
      commonActions.push(deleteRevision(kindObj, resource));
    }
    return commonActions;
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const useChannelActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    return [
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

export const useModifyApplicationActionProvider = (element: GraphElement) => {
  const actions = React.useMemo(() => {
    if (![TYPE_KNATIVE_SERVICE, TYPE_EVENT_PUB_SUB].includes(element.getType())) return undefined;
    const resource = element.getData().resources.obj;
    const k8sKind = modelFor(referenceFor(resource));
    return [
      getModifyApplicationAction(k8sKind, resource, [
        'set-traffic-distribution',
        'add-tigger-broker',
        'add-subscription-channel',
      ]),
    ];
  }, [element]);

  return React.useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};
