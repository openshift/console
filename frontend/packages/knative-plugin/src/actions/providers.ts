import { useMemo, useContext } from 'react';
import { GraphElement, Graph, Node, Edge, isEdge, isGraph } from '@patternfly/react-topology';
import { getHealthChecksAction } from '@console/app/src/actions/creators/health-checks-factory';
import { DeploymentActionCreator, CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { useDeploymentActions } from '@console/app/src/actions/hooks/useDeploymentActions';
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
import { useMoveConnectorAction } from '@console/topology/src/actions/edgeActions';
import { useGetModifyApplicationAction } from '@console/topology/src/actions/modify-application';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { useKnativeEventingEnabled } from '../catalog/useEventSourceProvider';
import { KnativeServiceTypeContext } from '../components/functions/ServiceTypeContext';
import { useSinkSourceModalLauncher } from '../components/sink-source/SinkSourceController';
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
import { SUBSCRIPTION_ACTION_ID, useAddSubscriptionAction } from './add-subscription';
import { TRIGGER_ACTION_ID, useAddTriggerAction } from './add-trigger';
import {
  editKnativeService,
  moveSinkSource,
  editKnativeServiceResource,
  deleteKnativeServiceResource,
  useDeleteRevisionAction,
  useSetTrafficDistributionAction,
  useMoveSinkPubsubAction,
  useTestServerlessFunctionAction,
  useEditSinkUriAction,
  useAddTriggerBrokerAction,
  useAddSubscriptionChannelAction,
} from './creators';
import { hideKnatifyAction, MakeServerless } from './knatify';

export const useMakeServerlessActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const deploymentActions = useMemo(() => {
    return hideKnatifyAction(resource) ? [] : MakeServerless(kindObj, resource);
  }, [kindObj, resource]);

  return [deploymentActions, !inFlight, undefined];
};

export const useSinkPubSubActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);
  const moveSinkSourceAction = useMoveSinkPubsubAction(kindObj, resource);
  const actions = useMemo(() => {
    return [moveSinkSourceAction, ...commonActions];
  }, [moveSinkSourceAction, commonActions]);

  return [actions, !inFlight, undefined];
};

export const useKnativeServiceActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const serviceTypeValue = useContext(KnativeServiceTypeContext);
  const setTrafficDistributionAction = useSetTrafficDistributionAction(kindObj, resource);
  const testServerlessFunctionAction = useTestServerlessFunctionAction(kindObj, resource);
  const [deploymentActions, deploymentActionsReady] = useDeploymentActions(kindObj, resource, [
    DeploymentActionCreator.EditResourceLimits,
  ] as const);

  const [commonActions, commonActionsReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
  ] as const);

  const isReady = commonActionsReady || deploymentActionsReady;

  const knativeServiceActions = useMemo(
    () =>
      !isReady
        ? []
        : [
            setTrafficDistributionAction,
            getHealthChecksAction(kindObj, resource),
            editKnativeService(kindObj, resource),
            deploymentActions.EditResourceLimits,
            ...Object.values(commonActions),
            editKnativeServiceResource(kindObj, resource, serviceTypeValue),
            ...(resource.metadata.annotations?.['openshift.io/generated-by'] ===
            'OpenShiftWebConsole'
              ? [deleteKnativeServiceResource(kindObj, resource, serviceTypeValue, true)]
              : [deleteKnativeServiceResource(kindObj, resource, serviceTypeValue, false)]),
            ...(resource?.metadata?.labels?.['function.knative.dev'] === 'true'
              ? [testServerlessFunctionAction]
              : []),
          ],
    [
      isReady,
      setTrafficDistributionAction,
      kindObj,
      resource,
      deploymentActions.EditResourceLimits,
      commonActions,
      serviceTypeValue,
      testServerlessFunctionAction,
    ],
  );

  return [knativeServiceActions, !inFlight, undefined];
};

export const useBrokerActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const isEventSinkTypeEnabled = isCatalogTypeEnabled(EVENT_SINK_CATALOG_TYPE_ID);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const addTriggerBrokerAction = useAddTriggerBrokerAction(kindObj, resource);
  const actions = useMemo(() => {
    const addActions: Action[] = [];
    const connectorSource = `${referenceFor(resource)}/${resource.metadata.name}`;
    addActions.push(addTriggerBrokerAction);
    if (isEventSinkTypeEnabled) {
      addActions.push(
        AddEventSinkMenuAction(resource.metadata.namespace, undefined, connectorSource),
      );
    }
    addActions.push(...commonActions);
    return addActions;
  }, [resource, addTriggerBrokerAction, isEventSinkTypeEnabled, commonActions]);

  return [actions, !inFlight, undefined];
};

export const useCommonActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);
  const deleteRevisionAction = useDeleteRevisionAction(kindObj, resource);
  const actions = useMemo(() => {
    if (
      resource.kind === RevisionModel.kind &&
      commonActions.findIndex((action: Action) => action.id === 'delete-resource')
    ) {
      const modifiedActions = commonActions.filter(
        (action: Action) => action.id !== 'delete-resource',
      );
      modifiedActions.push(deleteRevisionAction);
      return modifiedActions;
    }
    return commonActions;
  }, [resource.kind, commonActions, deleteRevisionAction]);

  return [actions, !inFlight, undefined];
};

export const useChannelActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const isEventSinkTypeEnabled = isCatalogTypeEnabled(EVENT_SINK_CATALOG_TYPE_ID);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const addSubscriptionChannelAction = useAddSubscriptionChannelAction(kindObj, resource);

  const actions = useMemo(() => {
    const addActions: Action[] = [];
    const connectorSource = `${referenceFor(resource)}/${resource.metadata.name}`;
    addActions.push(addSubscriptionChannelAction);
    if (isEventSinkTypeEnabled) {
      addActions.push(
        AddEventSinkMenuAction(resource.metadata.namespace, undefined, connectorSource),
      );
    }
    addActions.push(...commonActions);
    return addActions;
  }, [resource, addSubscriptionChannelAction, isEventSinkTypeEnabled, commonActions]);

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
  const connectorResource = connectorSource?.getData()?.resource;
  const addSubscriptionAction = useAddSubscriptionAction(connectorResource);
  const addTriggerAction = useAddTriggerAction(connectorResource);
  const {
    isEventSourceAddEnabled,
    isEventSinkAddEnabled,
    isChannelAddEnabled,
    isBrokerAddEnabled,
  } = getEventingEnabledAddAction();

  const [namespace] = useActiveNamespace();
  const actions = useMemo(() => {
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
    if (isEventingChannelResourceKind(sourceKind)) {
      const addActions: Action[] = [];
      addActions.push(addSubscriptionAction);
      if (isEventSinkTypeEnabled) {
        addActions.push(
          AddEventSinkMenuAction(
            namespace,
            application,
            `${sourceKind}/${connectorResource?.metadata?.name}`,
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
                `${sourceKind}/${connectorResource?.metadata?.name}`,
                '',
              ),
            ].filter(disabledActionsFilter)
          : [];
      case referenceForModel(EventingBrokerModel): {
        const addActions: Action[] = [];
        addActions.push(addTriggerAction);
        if (isEventSinkTypeEnabled) {
          addActions.push(
            AddEventSinkMenuAction(
              namespace,
              application,
              `${sourceKind}/${connectorResource?.metadata?.name}`,
            ),
          );
        }
        return addActions;
      }
      default:
        return [];
    }
  }, [
    addSubscriptionAction,
    addTriggerAction,
    connectorResource?.metadata?.name,
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
  const kindObj = resource ? modelFor(referenceFor(resource)) : null;

  const commonActions = useCommonResourceActions(kindObj, resource);
  const sinkSourceModalLauncher = useSinkSourceModalLauncher({ source: resource });
  const moveSinkSourceAction = moveSinkSource(kindObj, resource, sinkSourceModalLauncher);
  return useMemo(() => {
    if (!resource || resource.kind === 'URI') return [[], true, undefined];

    return [[moveSinkSourceAction, ...commonActions], true, undefined];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, commonActions]);
};

export const useEventSourcesActionsProviderForTopology = (element: GraphElement) => {
  const resource = useMemo(() => {
    if (![TYPE_EVENT_SOURCE, TYPE_EVENT_SOURCE_KAFKA].includes(element.getType())) return undefined;

    return element.getData().resources.obj;
  }, [element]);
  const result = useEventSourcesActionsProvider(resource);
  return result;
};

export const useModifyApplicationActionProvider = (element: GraphElement) => {
  const resource = element.getData()?.resources?.obj;
  const k8sKind = resource ? modelFor(referenceFor(resource)) : null;
  const getModifyApplicationAction = useGetModifyApplicationAction(k8sKind, resource, [
    'set-traffic-distribution',
    'add-tigger-broker',
    'add-subscription-channel',
    'move-sink-source',
  ]);
  const actions = useMemo(() => {
    if (
      ![
        TYPE_KNATIVE_SERVICE,
        TYPE_EVENT_PUB_SUB,
        TYPE_EVENT_SOURCE,
        TYPE_EVENT_SOURCE_KAFKA,
      ].includes(element.getType())
    )
      return undefined;
    return [getModifyApplicationAction];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  return useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};

export const useUriActionsProvider = (element: GraphElement) => {
  const eventSources =
    element.getType() === TYPE_SINK_URI && element.getData()?.resources?.eventSources;
  const resourceObj = element.getType() === TYPE_SINK_URI && element.getData()?.resources?.obj;
  const sourceModel = eventSources?.length > 0 ? modelFor(referenceFor(eventSources?.[0])) : null;
  const editSinkUriAction = useEditSinkUriAction(sourceModel, resourceObj, eventSources);
  const actions = useMemo(() => {
    if (element.getType() !== TYPE_SINK_URI) return undefined;
    if (eventSources.length > 0) {
      return [editSinkUriAction];
    }
    return null;
  }, [editSinkUriAction, element, eventSources?.length]);

  return useMemo(() => {
    if (!actions) {
      return [[], true, undefined];
    }
    return [actions, true, undefined];
  }, [actions]);
};

export const useKnativeConnectorActionProvider = (element: Edge) => {
  const { resource } =
    isEdge(element) && element.getSource()?.getData() && element.getSource().getData();
  const sourceModel = resource ? modelFor(referenceFor(resource)) : null;
  const sinkSourceModalLauncher = useSinkSourceModalLauncher({ source: resource });
  const moveConnectorAction = useMoveConnectorAction(sourceModel, element);
  const actions = useMemo(() => {
    const isEventSourceConnector = element.getType() === TYPE_EVENT_SOURCE_LINK;
    if (isEdge(element) && element.getSource()?.getData()) {
      if (isEventSourceConnector) {
        return [moveSinkSource(sourceModel, resource, sinkSourceModalLauncher)];
      }
      if ([TYPE_REVISION_TRAFFIC, TYPE_KAFKA_CONNECTION_LINK].includes(element.getType())) {
        return [moveConnectorAction];
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element, moveConnectorAction, resource, sourceModel]);
  return useMemo(() => {
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
  const resource = useMemo(() => element.getData()?.resources?.obj || {}, [element]);
  const [k8sModel] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(k8sModel, resource);
  const getModifyApplicationAction = useGetModifyApplicationAction(k8sModel, resource);
  const actions = useMemo(() => {
    const type = element.getType();
    if ((type !== TYPE_EVENT_SINK && type !== TYPE_KAFKA_SINK) || !k8sModel) return undefined;
    return k8sModel && resource ? [getModifyApplicationAction, ...commonActions] : undefined;
  }, [element, k8sModel, resource, getModifyApplicationAction, commonActions]);

  return useMemo(() => {
    if (!actions) {
      return [[], true, undefined];
    }
    return [actions, true, undefined];
  }, [actions]);
};
