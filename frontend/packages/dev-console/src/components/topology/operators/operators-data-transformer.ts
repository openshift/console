import * as _ from 'lodash';
import {
  K8sResourceKind,
  LabelSelector,
  modelFor,
  referenceFor,
} from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import {
  createOverviewItemForType,
  getDefaultOperatorIcon,
  getImageForCSVIcon,
  getOperatorBackedServiceKindMap,
} from '@console/shared';
import { EdgeModel, Model, NodeShape } from '@patternfly/react-topology';
import { TopologyDataResources } from '../topology-types';
import {
  OPERATOR_GROUP_WIDTH,
  OPERATOR_GROUP_HEIGHT,
  OPERATOR_GROUP_PADDING,
  TYPE_OPERATOR_BACKED_SERVICE,
  TYPE_OPERATOR_WORKLOAD,
} from './components/const';
import {
  addToTopologyDataModel,
  createTopologyNodeData,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  WorkloadModelProps,
} from '../data-transforms/transform-utils';
import { WORKLOAD_TYPES } from '../topology-utils';
import { TYPE_SERVICE_BINDING } from '../components';
import { isOperatorBackedKnResource } from '@console/knative-plugin/src/topology/knative-topology-utils';

export const edgesFromServiceBinding = (
  source: K8sResourceKind,
  sbrs: K8sResourceKind[],
): K8sResourceKind[] => {
  const sourceBindings = [];
  if (!sbrs) {
    return sourceBindings;
  }
  sbrs.forEach((sbr) => {
    let edgeExists = false;
    const reference = referenceFor(source);
    if (reference && sbr?.spec?.applicationSelector?.resource === modelFor(reference)?.plural) {
      if (sbr?.spec?.applicationSelector?.resourceRef === source.metadata.name) {
        edgeExists = true;
      } else {
        const matchLabels = sbr?.spec?.applicationSelector?.matchLabels;
        if (matchLabels) {
          const sbrSelector = new LabelSelector(sbr.spec.applicationSelector);
          if (sbrSelector.matches(source)) {
            edgeExists = true;
          }
        }
      }
    }
    edgeExists && sourceBindings.push(sbr);
  });
  return sourceBindings;
};

export const getServiceBindingEdges = (
  dc: K8sResourceKind,
  resources: K8sResourceKind[],
  sbrs: K8sResourceKind[],
): EdgeModel[] => {
  const edges = [];

  _.forEach(edgesFromServiceBinding(dc, sbrs), (sbr) => {
    // look for multiple backing services first in `backingServiceSelectors`
    // followed by a fallback to the single reference in `backingServiceSelector`
    _.forEach(sbr.spec.backingServiceSelectors || [sbr.spec.backingServiceSelector], (bss) => {
      if (bss) {
        // handles multiple edges
        const targetResource = resources.find(
          (deployment) =>
            deployment?.metadata?.ownerReferences?.[0]?.kind === bss.kind &&
            deployment?.metadata?.ownerReferences?.[0]?.name === bss.resourceRef,
        );
        const target = targetResource?.metadata?.uid;
        const source = dc?.metadata?.uid;
        if (source && target) {
          edges.push({
            id: `${source}_${target}`,
            type: TYPE_SERVICE_BINDING,
            source,
            target,
            resource: sbr,
            data: { sbr },
          });
        }
      }
    });
  });

  return edges;
};

const OBSModelProps = {
  width: OPERATOR_GROUP_WIDTH,
  height: OPERATOR_GROUP_HEIGHT,
  visible: true,
  group: true,
  shape: NodeShape.rect,
  style: {
    padding: OPERATOR_GROUP_PADDING,
  },
};

const isOperatorBackedService = (
  obj: K8sResourceKind,
  installedOperators: ClusterServiceVersionKind[],
  resources?: TopologyDataResources,
): boolean => {
  const kind = _.get(obj, 'metadata.ownerReferences[0].kind', null);
  const ownerUid = _.get(obj, 'metadata.ownerReferences[0].uid');
  // added this as needs to hide oprator backed if belong to source
  if (resources && isOperatorBackedKnResource(obj, resources)) {
    return false;
  }
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorResource: K8sResourceKind = _.find(installedOperators, {
    metadata: { uid: ownerUid },
  }) as K8sResourceKind;
  return !!(
    kind &&
    operatorBackedServiceKindMap &&
    (!_.isEmpty(operatorResource) || kind in operatorBackedServiceKindMap)
  );
};
export const getOperatorTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  const operatorsDataModel: Model = {
    nodes: [],
    edges: [],
  };
  const installedOperators = resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[];
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorMap = {};
  const obsGroups = {};
  const serviceBindingRequests = resources?.serviceBindingRequests?.data;

  WORKLOAD_TYPES.forEach((key) => {
    if (resources[key]?.data && resources[key].data.length) {
      const typedDataModel: Model = { nodes: [], edges: [] };

      resources[key].data.forEach((resource) => {
        const item = createOverviewItemForType(key, resource, resources);
        if (item && isOperatorBackedService(resource, installedOperators, resources)) {
          const ownerReference = resource?.metadata?.ownerReferences?.[0];
          const ownerUid = ownerReference?.uid;
          const nodeResourceKind = ownerReference?.kind;
          const operatorBackedServiceKind = operatorBackedServiceKindMap?.[nodeResourceKind];
          const appGroup = resource?.metadata?.labels?.['app.kubernetes.io/part-of'];
          let operator: K8sResourceKind = installedOperators.find(
            (op) => op.metadata.uid === ownerUid,
          ) as K8sResourceKind;

          if (!operator) {
            operator = operatorBackedServiceKind;
          }

          const csvIcon = operatorBackedServiceKind?.spec?.icon?.[0] || operator?.spec?.icon?.[0];

          const operatorName = appGroup
            ? `${appGroup}:${operator.metadata.name}`
            : operator.metadata.name;
          const data = createTopologyNodeData(
            resource,
            item,
            TYPE_OPERATOR_WORKLOAD,
            getImageForCSVIcon(csvIcon) || getDefaultOperatorIcon(),
            true,
          );
          typedDataModel.nodes.push(
            getTopologyNodeItem(resource, TYPE_OPERATOR_WORKLOAD, data, WorkloadModelProps),
          );

          operatorMap[operatorName] = _.merge({}, operator, {
            metadata: {
              uid: `${operatorName}:${operator.metadata.uid}`,
            },
          });
          if (!(operatorName in obsGroups)) {
            obsGroups[operatorName] = [];
          }
          obsGroups[operatorName].push(resource.metadata.uid);

          if (appGroup) {
            const newGroup = getTopologyGroupItems(
              _.merge({}, resource, {
                metadata: {
                  uid: `${operatorName}:${operator.metadata.uid}`,
                },
              }),
            );
            mergeGroup(newGroup, typedDataModel.nodes);
          }
        }
      });
      addToTopologyDataModel(typedDataModel, operatorsDataModel);
    }
  });

  workloads.forEach((dc) => {
    operatorsDataModel.edges.push(...getServiceBindingEdges(dc, workloads, serviceBindingRequests));
  });

  _.forIn(obsGroups, (children: string[], grp: string) => {
    const groupDataModel: Model = { nodes: [], edges: [] };
    const data = {
      id: operatorMap[grp].metadata.uid,
      name: operatorMap[grp].metadata.name,
      type: TYPE_OPERATOR_BACKED_SERVICE,
      resources: {
        obj: operatorMap[grp],
        buildConfigs: [],
        routes: [],
        services: [],
        isOperatorBackedService: true,
      },
      groupResources: children.map((id) => operatorsDataModel.nodes.find((n) => id === n.id)?.data),
      data: {
        builderImage:
          getImageForCSVIcon(operatorMap?.[grp]?.spec?.icon?.[0]) || getDefaultOperatorIcon(),
      },
    };
    groupDataModel.nodes.push(
      getTopologyNodeItem(
        operatorMap[grp],
        TYPE_OPERATOR_BACKED_SERVICE,
        data,
        OBSModelProps,
        children,
      ),
    );

    addToTopologyDataModel(groupDataModel, operatorsDataModel);
  });

  return Promise.resolve(operatorsDataModel);
};
