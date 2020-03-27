import { EdgeModel, NodeModel, NodeShape } from '@console/topology';
import {
  TopologyDataModel as DataModel,
  TopologyDataObject,
  dataObjectFromModel,
  Group,
  Node,
  Edge,
  NODE_HEIGHT,
  NODE_PADDING,
  NODE_WIDTH,
  TopologyFilters as Filters,
} from '@console/dev-console/src/components/topology';
import {
  KNATIVE_GROUP_NODE_HEIGHT,
  KNATIVE_GROUP_NODE_PADDING,
  KNATIVE_GROUP_NODE_WIDTH,
  TYPE_EVENT_SOURCE,
  TYPE_KNATIVE_SERVICE,
} from './const';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getKnativeGroupModel = (d: Group, model: DataModel, filters: Filters): NodeModel => {
  return null;
};

export const getKnativeNodeModel = (d: Node, model: DataModel, filters: Filters): NodeModel => {
  if (d.type === TYPE_EVENT_SOURCE) {
    const hidden = filters && !filters.display.eventSources;
    return {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      id: d.id,
      type: d.type,
      visible: !hidden,
      label: model.topology[d.id].name,
      data: model.topology[d.id],
      style: {
        padding: NODE_PADDING,
      },
    };
  }
  if (d.type === TYPE_KNATIVE_SERVICE) {
    const data: TopologyDataObject = model.topology[d.id] || dataObjectFromModel(d);
    data.groupResources = d.children && d.children.map((id) => model.topology[id]);
    return {
      width: KNATIVE_GROUP_NODE_WIDTH,
      height: KNATIVE_GROUP_NODE_HEIGHT,
      id: d.id,
      type: d.type,
      visible: true,
      label: model.topology[d.id].name,
      data,
      collapsed: filters && !filters.display.knativeServices,
      children: d.children,
      group: true,
      shape: NodeShape.rect,
      style: {
        padding: KNATIVE_GROUP_NODE_PADDING,
      },
    };
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getKnativeEdgeModel = (d: Edge, model: DataModel, filters: Filters): EdgeModel => {
  return null;
};
