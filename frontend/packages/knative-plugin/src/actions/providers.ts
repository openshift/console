import * as React from 'react';
import { GraphElement, Graph, Node, Edge, isEdge, isGraph } from '@patternfly/react-topology';
import {
  CommonActionFactory,
  getCommonResourceActions,
} from '@console/app/src/actions/creators/common-factory';
import { DeploymentActionFactory } from '@console/app/src/actions/creators/deployment-factory';
import { getHealthChecksAction } from '@console/app/src/actions/creators/health-checks-factory';
import { disabledActionsFilter } from '@console/dev-console/src/actions/add-resources';
import { getDisabledAddActions } from '@console/dev-console/src/utils/useAddActionExtensions';
import { Action } from '@console/dynamic-plugin-sdk';
import {
  K8sResourceKind,
  referenceFor,
  referenceForModel,
  modelFor,
} from '@console/internal/module/k8s';
import { isCatalogTypeEnabled, useActiveNamespace } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { MoveConnectorAction } from '@console/topology/src/actions/edgeActions';
import { getModifyApplicationAction } from '@console/topology/src/actions/modify-application';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { useKnativeEventingEnabled } from '../catalog/useEventSourceProvider';
import { KnativeServiceTypeContext } from '../components/functions/ServiceTypeContext';
import {
  EVENTING_BROKER_ACTION_ID,
  EVENTING_CHANNEL_ACTION_ID,
  EVENT_SINK_ACTION_ID,
  EVENT_SINK_CATALOG_TYPE_ID,
  EVENT_SOURCE_ACTION_ID,
  EVENT_SOURCE_CATALOG_TYPE_ID,
} from '../const';
import { RevisionModel, EventingBrokerModel, ServiceModel } from '../models';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_KAFKA,
  TYPE_EVENT_PUB_SUB,
  TYPE_KNATIVE_SERVICE,
  TYPE_SINK_URI,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_EVENT_SINK,
  TYPE_KAFKA_SINK,
} from '../topology/const';
import { isEventingChannelResourceKind } from '../utils/fetch-dynamic-eventsources-utils';
import { AddBrokerAction } from './add-broker';
import { AddChannelAction } from './add-channel';
import {
  AddEventSinkAction,
  AddEventSinkMenuAction,
  EVENT_SINK_ADD_CONNECTOR_ACTION,
} from './add-event-sink';
import { AddEventSourceAction } from './add-event-source';
import { AddSubscriptionAction, SUBSCRIPTION_ACTION_ID } from './add-subscription';
import { AddTriggerAction, TRIGGER_ACTION_ID } from './add-trigger';
import {
  addSubscriptionChannel,
  addTriggerBroker,
  editSinkUri,
  moveSinkPubsub,
  deleteRevision,
  editKnativeService,
  setTrafficDistribution,
  moveSinkSource,
  testServerlessFunction,
  editKnativeServiceResource,
  deleteKnativeServiceResource,
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
  const serviceTypeValue = React.useContext(KnativeServiceTypeContext);
  const actions = React.useMemo(() => {
    return [
      setTrafficDistribution(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      editKnativeService(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      editKnativeServiceResource(kindObj, resource, serviceTypeValue),
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [deleteKnativeServiceResource(kindObj, resource, serviceTypeValue, true)]
        : [deleteKnativeServiceResource(kindObj, resource, serviceTypeValue, false)]),
      ...(resource?.metadata?.labels?.['function.knative.dev'] === 'true'
        ? [testServerlessFunction(kindObj, resource)]
        : []),
    ];
  }, [kindObj, resource, serviceTypeValue]);

  return [actions, !inFlight, undefined];
};

export const useBrokerActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const isEventSinkTypeEnabled = isCatalogTypeEnabled(EVENT_SINK_CATALOG_TYPE_ID);
  const actions = React.useMemo(() => {
    const addActions: Action[] = [];
    const connectorSource = `${referenceFor(resource)}/${resource.metadata.name}`;
    addActions.push(addTriggerBroker(kindObj, resource));
    if (isEventSinkTypeEnabled) {
      addActions.push(
        AddEventSinkMenuAction(resource.metadata.namespace, undefined, connectorSource),
      );
    }
    addActions.push(...getCommonResourceActions(kindObj, resource));
    return addActions;
  }, [isEventSinkTypeEnabled, kindObj, resource]);

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
  const isEventSinkTypeEnabled = isCatalogTypeEnabled(EVENT_SINK_CATALOG_TYPE_ID);
  const actions = React.useMemo(() => {
    const addActions: Action[] = [];
    const connectorSource = `${referenceFor(resource)}/${resource.metadata.name}`;
    addActions.push(addSubscriptionChannel(kindObj, resource));
    if (isEventSinkTypeEnabled) {
      addActions.push(
        AddEventSinkMenuAction(resource.metadata.namespace, undefined, connectorSource),
      );
    }
    addActions.push(...getCommonResourceActions(kindObj, resource));
    return addActions;
  }, [isEventSinkTypeEnabled, kindObj, resource]);

  return [actions, !inFlight, undefined];
};

const getEventingEnabledAddAction = () => {
  const disabledAddActions = getDisabledAddActions();
  return {
    isEventSourceAddEnabled: !disabledAddActions?.includes(EVENT_SOURCE_ACTION_ID),
    isEventSinkAddEnabled: !disabledAddActions?.includes(EVENT_SINK_ACTION_ID),
    isChannelAddEnabled: !disabledAddActions?.includes(EVENTING_CHANNEL_ACTION_ID),
    isBrokerAddEnabled: !disabledAddActions?.includes(EVENTING_BROKER_ACTION_ID),
  };
};

export const useTopologyActionsProvider = ({
  element,
  connectorSource,
}: {
  element: GraphElement;
  connectorSource?: Node;
}) => {
  const isEventSinkTypeEnabled = isCatalogTypeEnabled(EVENT_SINK_CATALOG_TYPE_ID);
  const isEventSourceTypeEnabled = isCatalogTypeEnabled(EVENT_SOURCE_CATALOG_TYPE_ID);
  const isEventingEnabled = useKnativeEventingEnabled();
  const {
    isEventSourceAddEnabled,
    isEventSinkAddEnabled,
    isChannelAddEnabled,
    isBrokerAddEnabled,
  } = getEventingEnabledAddAction();

  const [namespace] = useActiveNamespace();
  const actions = React.useMemo(() => {
    const application = element.getLabel();
    if (!connectorSource) {
      if (!isGraph(element) && element.getType() !== TYPE_APPLICATION_GROUP) {
        return [];
      }
      const path = application ? 'add-to-application' : 'add-to-project';
      const addActions: Action[] = [];
      if (isEventSinkAddEnabled && isEventSinkTypeEnabled && isEventingEnabled) {
        addActions.push(AddEventSinkAction(namespace, application, undefined, path));
      }
      if (isEventSourceAddEnabled && isEventSourceTypeEnabled && isEventingEnabled) {
        addActions.push(AddEventSourceAction(namespace, application, undefined, path));
      }
      if (isEventingEnabled && isChannelAddEnabled) {
        addActions.push(AddChannelAction(namespace, application, path));
      }
      if (isEventingEnabled && isBrokerAddEnabled) {
        addActions.push(AddBrokerAction(namespace, application, path));
      }
      return addActions.filter(disabledActionsFilter);
    }

    if (connectorSource.getData().type === TYPE_EVENT_SOURCE_KAFKA) return [];

    const sourceKind = connectorSource.getData().data.kind;
    const connectorResource = connectorSource.getData().resource;
    if (isEventingChannelResourceKind(sourceKind)) {
      const addActions: Action[] = [];
      addActions.push(AddSubscriptionAction(connectorResource));
      if (isEventSinkTypeEnabled) {
        addActions.push(
          AddEventSinkMenuAction(
            namespace,
            application,
            `${sourceKind}/${connectorResource.metadata.name}`,
          ),
        );
      }
      return addActions;
    }
    switch (sourceKind) {
      case referenceForModel(ServiceModel):
        return isEventSourceTypeEnabled && isEventSourceAddEnabled && isEventingEnabled
          ? [
              AddEventSourceAction(
                namespace,
                application,
                `${sourceKind}/${connectorResource.metadata.name}`,
                '',
              ),
            ].filter(disabledActionsFilter)
          : [];
      case referenceForModel(EventingBrokerModel): {
        const addActions: Action[] = [];
        addActions.push(AddTriggerAction(connectorResource));
        if (isEventSinkTypeEnabled) {
          addActions.push(
            AddEventSinkMenuAction(
              namespace,
              application,
              `${sourceKind}/${connectorResource.metadata.name}`,
            ),
          );
        }
        return addActions;
      }
      default:
        return [];
    }
  }, [
    connectorSource,
    element,
    isBrokerAddEnabled,
    isChannelAddEnabled,
    isEventSinkAddEnabled,
    isEventSinkTypeEnabled,
    isEventSourceAddEnabled,
    isEventSourceTypeEnabled,
    isEventingEnabled,
    namespace,
  ]);
  return [actions, true, undefined];
};

export const useEventSourcesActionsProvider = (resource: K8sResourceKind) => {
  const result = React.useMemo(() => {
    if (!resource || resource.kind === 'URI') return [[], true, undefined];
    const kindObj = modelFor(referenceFor(resource));
    return [
      [moveSinkSource(kindObj, resource), ...getCommonResourceActions(kindObj, resource)],
      true,
      undefined,
    ];
  }, [resource]);
  return result;
};

export const useEventSourcesActionsProviderForTopology = (element: GraphElement) => {
  const resource = React.useMemo(() => {
    if (![TYPE_EVENT_SOURCE, TYPE_EVENT_SOURCE_KAFKA].includes(element.getType())) return undefined;

    return element.getData().resources.obj;
  }, [element]);
  const result = useEventSourcesActionsProvider(resource);
  return result;
};

export const useModifyApplicationActionProvider = (element: GraphElement) => {
  const actions = React.useMemo(() => {
    if (
      ![
        TYPE_KNATIVE_SERVICE,
        TYPE_EVENT_PUB_SUB,
        TYPE_EVENT_SOURCE,
        TYPE_EVENT_SOURCE_KAFKA,
      ].includes(element.getType())
    )
      return undefined;
    const resource = element.getData().resources.obj;
    const k8sKind = modelFor(referenceFor(resource));
    return [
      getModifyApplicationAction(k8sKind, resource, [
        'set-traffic-distribution',
        'add-tigger-broker',
        'add-subscription-channel',
        'move-sink-source',
      ]),
    ];
  }, [element]);

  return React.useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};

export const useUriActionsProvider = (element: GraphElement) => {
  const actions = React.useMemo(() => {
    if (element.getType() !== TYPE_SINK_URI) return undefined;
    const { obj, eventSources } = element.getData().resources;
    if (eventSources.length > 0) {
      const sourceModel = modelFor(referenceFor(eventSources[0]));
      return [editSinkUri(sourceModel, obj, eventSources)];
    }
    return null;
  }, [element]);

  return React.useMemo(() => {
    if (!actions) {
      return [[], true, undefined];
    }
    return [actions, true, undefined];
  }, [actions]);
};

export const useKnativeConnectorActionProvider = (element: Edge) => {
  const actions = React.useMemo(() => {
    const isEventSourceConnector = element.getType() === TYPE_EVENT_SOURCE_LINK;
    if (isEdge(element) && element.getSource()?.getData()) {
      const { resource } = element.getSource().getData();
      const sourceModel = modelFor(referenceFor(resource));
      if (isEventSourceConnector) {
        return [moveSinkSource(sourceModel, resource)];
      }
      if ([TYPE_REVISION_TRAFFIC, TYPE_KAFKA_CONNECTION_LINK].includes(element.getType())) {
        return [MoveConnectorAction(sourceModel, element)];
      }
    }
    return null;
  }, [element]);
  return React.useMemo(() => {
    if (!actions) {
      return [[], true, undefined];
    }
    return [actions, true, undefined];
  }, [actions]);
};

export const topologyServerlessActionsFilter = (
  scope: {
    element: Graph;
    connectorSource?: Node;
  },
  action: Action,
) => {
  if (
    [TYPE_EVENT_SOURCE_KAFKA, TYPE_EVENT_PUB_SUB].includes(scope.connectorSource?.getData().type) &&
    ![TRIGGER_ACTION_ID, SUBSCRIPTION_ACTION_ID, EVENT_SINK_ADD_CONNECTOR_ACTION].includes(
      action.id,
    )
  ) {
    return false;
  }
  return true;
};

export const useKnativeEventSinkActionProvider = (element: Node) => {
  const resource = React.useMemo(() => element.getData()?.resources?.obj || {}, [element]);
  const [k8sModel] = useK8sModel(referenceFor(resource));
  const actions = React.useMemo(() => {
    const type = element.getType();
    if ((type !== TYPE_EVENT_SINK && type !== TYPE_KAFKA_SINK) || !k8sModel) return undefined;
    return k8sModel && resource
      ? [
          getModifyApplicationAction(k8sModel, resource),
          ...getCommonResourceActions(k8sModel, resource),
        ]
      : undefined;
  }, [element, k8sModel, resource]);

  return React.useMemo(() => {
    if (!actions) {
      return [[], true, undefined];
    }
    return [actions, true, undefined];
  }, [actions]);
};
