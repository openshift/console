import { EdgeModel, Model, NodeModel, createAggregateEdges } from '@console/topology';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import {
  getKnativeNodeModel,
  getKnativeGroupModel,
  getKnativeEdgeModel,
} from '@console/knative-plugin/src/topology/knative-topology-model';
import {
  getKubevirtGroupModel,
  getKubevirtNodeModel,
  getKubevirtEdgeModel,
} from '@console/kubevirt-plugin/src/topology/kubevirt-topology-model';
import { getHelmEdgeModel, getHelmGroupModel, getHelmNodeModel } from '../helm/helm-topology-model';
import {
  getOperatorEdgeModel,
  getOperatorGroupModel,
  getOperatorNodeModel,
} from '../operators/operators-topology-model';
import { TopologyFilters } from '../filters/filter-utils';
import { TopologyDataModel, TopologyDataObject, Node } from '../topology-types';
import {
  TYPE_APPLICATION_GROUP,
  TYPE_AGGREGATE_EDGE,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_PADDING,
  GROUP_WIDTH,
  GROUP_HEIGHT,
  GROUP_PADDING,
} from '../components/const';
import { dataObjectFromModel } from './transform-utils';

const getApplicationGroupForNode = (node: Node, groups: NodeModel[]): NodeModel => {
  const group = groups.find((g) => g.children.includes(node.id));
  if (!group) {
    return null;
  }
  if (group.type === TYPE_APPLICATION_GROUP) {
    return group;
  }
  return getApplicationGroupForNode(group, groups);
};

export const topologyModelFromDataModel = (
  dataModel: TopologyDataModel,
  application: string = ALL_APPLICATIONS_KEY,
  filters?: TopologyFilters,
): Model => {
  const groupNodes: NodeModel[] = dataModel.graph.groups.map((d) => {
    // TODO: Change to use plugins
    let node = getKnativeGroupModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    node = getKubevirtGroupModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    node = getHelmGroupModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    node = getOperatorGroupModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    const data: TopologyDataObject = dataModel.topology[d.id] || dataObjectFromModel(d);
    data.groupResources = d.nodes.map((id) => dataModel.topology[id]);

    return {
      width: GROUP_WIDTH,
      height: GROUP_HEIGHT,
      id: d.id,
      group: true,
      type: d.type,
      visible:
        d.type !== TYPE_APPLICATION_GROUP ||
        application === ALL_APPLICATIONS_KEY ||
        d.name === application,
      collapsed: filters && d.type === TYPE_APPLICATION_GROUP && !filters.display.appGrouping,
      data,
      children: d.nodes,
      label: d.name,
      style: {
        padding: GROUP_PADDING,
      },
    };
  });

  const nodes: NodeModel[] = dataModel.graph.nodes.map((d) => {
    // TODO: Change to use plugins
    let node = getKnativeNodeModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    node = getKubevirtNodeModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    node = getHelmNodeModel(d, dataModel, filters);
    if (node) {
      return node;
    }
    node = getOperatorNodeModel(d, dataModel, filters);
    if (node) {
      return node;
    }

    return {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      id: d.id,
      type: d.type,
      label: dataModel.topology[d.id].name,
      data: dataModel.topology[d.id],
      visible: true,
      style: {
        padding: NODE_PADDING,
      },
    };
  });

  const allNodes = [...nodes, ...groupNodes];

  // Flag any hidden nodes
  if (application !== ALL_APPLICATIONS_KEY) {
    const allGroups = [...groupNodes, ...nodes.filter((n) => n.group)];
    allNodes
      .filter((g) => g.type !== TYPE_APPLICATION_GROUP)
      .forEach((g) => {
        const group = getApplicationGroupForNode(g, allGroups);
        const hidden =
          application !== ALL_APPLICATIONS_KEY && (!group || application !== group.label);
        g.visible = !hidden;
      });
  }

  // create links from data, only include those which have a valid source and target
  const edges = dataModel.graph.edges
    .filter((d) => {
      return allNodes.find((n) => n.id === d.source) && allNodes.find((n) => n.id === d.target);
    })
    .map(
      (d): EdgeModel => {
        // TODO: Change to use plugins
        let edge = getKnativeEdgeModel(d, dataModel, filters);
        if (edge) {
          return edge;
        }
        edge = getKubevirtEdgeModel(d, dataModel, filters);
        if (edge) {
          return edge;
        }
        edge = getHelmEdgeModel(d, dataModel, filters);
        if (edge) {
          return edge;
        }
        edge = getOperatorEdgeModel(d, dataModel, filters);
        if (edge) {
          return edge;
        }

        return {
          data: d,
          source: d.source,
          target: d.target,
          id: `${d.source}_${d.target}`,
          type: d.type,
        };
      },
    );

  // create topology model
  const model: Model = {
    nodes: allNodes,
    edges: createAggregateEdges(TYPE_AGGREGATE_EDGE, edges, allNodes),
  };

  return model;
};
