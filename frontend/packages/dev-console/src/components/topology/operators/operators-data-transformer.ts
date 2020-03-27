import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  getDefaultOperatorIcon,
  getImageForCSVIcon,
  getOperatorBackedServiceKindMap,
} from '@console/shared/src';
import { TopologyDataModel, TopologyDataResources } from '../topology-types';
import { TYPE_OPERATOR_BACKED_SERVICE, TYPE_OPERATOR_WORKLOAD } from './components/const';
import {
  addToTopologyDataModel,
  createInstanceForResource,
  createTopologyNodeData,
  getTopologyEdgeItems,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
} from '../data-transforms/transform-utils';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';

export const getOperatorTopologyDataModel = (
  resources: TopologyDataResources,
  allResources: K8sResourceKind[],
  installedOperators: ClusterServiceVersionKind[],
  utils: Function[],
  transformBy: string[],
  serviceBindingRequests: K8sResourceKind[],
): TopologyDataModel => {
  const operatorsDataModel: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorMap = {};
  const obsGroups = {};
  const transformResourceData = createInstanceForResource(resources, utils, installedOperators);

  _.forEach(transformBy, (key) => {
    if (!_.isEmpty(resources[key].data)) {
      const typedDataModel: TopologyDataModel = {
        graph: { nodes: [], edges: [], groups: [] },
        topology: {},
      };

      transformResourceData[key](resources[key].data, true).forEach((item) => {
        const { obj: deploymentConfig } = item;
        const uid = _.get(deploymentConfig, ['metadata', 'uid']);
        const ownerUid = _.get(deploymentConfig, 'metadata.ownerReferences[0].uid');
        const nodeResourceKind = _.get(deploymentConfig, 'metadata.ownerReferences[0].kind');
        const appGroup = _.get(deploymentConfig, [
          'metadata',
          'labels',
          'app.kubernetes.io/part-of',
        ]);
        let operator: K8sResourceKind = _.find(installedOperators, {
          metadata: { uid: ownerUid },
        }) as K8sResourceKind;

        if (_.isEmpty(operator)) {
          operator = operatorBackedServiceKindMap[nodeResourceKind];
        }
        const operatorName = appGroup
          ? `${appGroup}:${operator.metadata.name}`
          : operator.metadata.name;
        typedDataModel.topology[uid] = createTopologyNodeData(
          item,
          TYPE_OPERATOR_BACKED_SERVICE,
          getImageForCSVIcon(
            _.get(operatorBackedServiceKindMap[nodeResourceKind], 'spec.icon.0'),
          ) || getDefaultOperatorIcon(),
          true,
        );
        typedDataModel.graph.nodes.push(
          getTopologyNodeItem(deploymentConfig, TYPE_OPERATOR_WORKLOAD),
        );
        typedDataModel.graph.edges.push(
          ...getTopologyEdgeItems(deploymentConfig, allResources, serviceBindingRequests),
        );
        operatorMap[operatorName] = _.merge({}, operator, {
          metadata: {
            uid: `${operatorName}:${operator.metadata.uid}`,
          },
        });
        if (!(operatorName in obsGroups)) {
          obsGroups[operatorName] = [];
        }
        obsGroups[operatorName].push(deploymentConfig.metadata.uid);
        if (appGroup) {
          const newGroup = getTopologyGroupItems(
            _.merge({}, deploymentConfig, {
              metadata: {
                uid: `${operatorName}:${operator.metadata.uid}`,
              },
            }),
          );
          mergeGroup(newGroup, typedDataModel.graph.groups);
        }
      });
      addToTopologyDataModel(typedDataModel, operatorsDataModel);
    }
  });

  _.forIn(obsGroups, (children, grp) => {
    const groupDataModel: TopologyDataModel = {
      graph: { nodes: [], edges: [], groups: [] },
      topology: {},
    };
    groupDataModel.graph.nodes.push(
      getTopologyNodeItem(operatorMap[grp], TYPE_OPERATOR_BACKED_SERVICE, children),
    );

    groupDataModel.topology[operatorMap[grp].metadata.uid] = {
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
      operatorBackedService: true,
      data: {
        builderImage:
          getImageForCSVIcon(_.get(operatorMap[grp], 'spec.icon.0')) || getDefaultOperatorIcon(),
      },
    };
    addToTopologyDataModel(groupDataModel, operatorsDataModel);
  });

  _.forEach(transformBy, (key) => {
    const operatorResources = transformResourceData[key](resources[key].data, true);
    if (!_.isEmpty(resources[key].data) && !_.isEmpty(operatorResources)) {
      resources[key].data = resources[key].data.filter(
        (resource) =>
          !operatorResources.find(
            (operatorResource) => operatorResource.obj.metadata.uid === resource.metadata.uid,
          ),
      );
    }
  });

  return operatorsDataModel;
};
