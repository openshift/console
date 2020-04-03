import * as _ from 'lodash';
import { getOperatorBackedServiceKindMap, OperatorBackedServiceKindMap } from '@console/shared';
import { DeploymentKind, K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  TopologyDataModel,
  TopologyDataResources,
  addToTopologyDataModel,
} from '@console/dev-console/src/components/topology';
import { NodeType, transformKnNodeData } from './knative-topology-utils';

/**
 * Filter out deployments not created via revisions/eventsources
 */
export const filterNonKnativeDeployments = (
  resources: DeploymentKind[],
  eventSources?: K8sResourceKind[],
): DeploymentKind[] => {
  const KNATIVE_CONFIGURATION = 'serving.knative.dev/configuration';
  const isEventSourceKind = (uid: string): boolean =>
    uid && !!eventSources?.find((eventSource) => eventSource.metadata?.uid === uid);
  return _.filter(resources, (d) => {
    return (
      !_.get(d, ['metadata', 'labels', KNATIVE_CONFIGURATION], false) &&
      !isEventSourceKind(d.metadata?.ownerReferences?.[0].uid)
    );
  });
};

const addKnativeTopologyData = (
  topologyDataModel: TopologyDataModel,
  knativeResources: K8sResourceKind[],
  allResources: K8sResourceKind[],
  type: string,
  resources: TopologyDataResources,
  operatorBackedServiceKindMap: OperatorBackedServiceKindMap,
  utils: Function[],
) => {
  if (!knativeResources?.length) {
    return;
  }

  const knativeResourceDataModel = transformKnNodeData(
    knativeResources,
    type,
    resources,
    allResources,
    operatorBackedServiceKindMap,
    utils,
  );

  addToTopologyDataModel(knativeResourceDataModel, topologyDataModel);
};

const getKnativeEventSources = (resources: TopologyDataResources): K8sResourceKind[] => {
  return _.concat(
    _.get(resources, 'eventSourceCronjob.data', []),
    _.get(resources, 'eventSourceContainers.data', []),
    _.get(resources, 'eventSourceApiserver.data', []),
    _.get(resources, 'eventSourceCamel.data', []),
    _.get(resources, 'eventSourceKafka.data', []),
    _.get(resources, 'eventSourceSinkbinding.data', []),
  );
};

export const getKnativeTopologyDataModel = (
  resources: TopologyDataResources,
  allResources: K8sResourceKind[],
  installedOperators: ClusterServiceVersionKind[],
  utils?: Function[],
): TopologyDataModel => {
  const knativeTopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);

  const knSvcResources: K8sResourceKind[] = _.get(resources, ['ksservices', 'data'], []);
  const knEventSources: K8sResourceKind[] = getKnativeEventSources(resources);
  const knRevResources: K8sResourceKind[] = _.get(resources, ['revisions', 'data'], []);

  addKnativeTopologyData(
    knativeTopologyDataModel,
    knSvcResources,
    allResources,
    NodeType.KnService,
    resources,
    operatorBackedServiceKindMap,
    utils,
  );
  addKnativeTopologyData(
    knativeTopologyDataModel,
    knEventSources,
    allResources,
    NodeType.EventSource,
    resources,
    operatorBackedServiceKindMap,
    utils,
  );
  addKnativeTopologyData(
    knativeTopologyDataModel,
    knRevResources,
    allResources,
    NodeType.Revision,
    resources,
    operatorBackedServiceKindMap,
    utils,
  );

  const deploymentResources: DeploymentKind[] = _.get(resources, ['deployments', 'data'], []);
  resources.deployments.data = filterNonKnativeDeployments(deploymentResources, knEventSources);

  return knativeTopologyDataModel;
};
