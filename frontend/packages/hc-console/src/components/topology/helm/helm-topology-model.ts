import { NodeModel, EdgeModel } from '@console/topology';
import { TopologyFilters as Filters } from '../filters';
import {
  TopologyDataModel as DataModel,
  TopologyDataObject,
  Node,
  Group,
  Edge,
} from '../topology-types';
import {
  TYPE_HELM_RELEASE,
  HELM_GROUP_WIDTH,
  HELM_GROUP_HEIGHT,
  HELM_GROUP_PADDING,
} from './components/const';
import { dataObjectFromModel } from '../data-transforms/transform-utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getHelmGroupModel = (d: Group, model: DataModel, filters: Filters): NodeModel => {
  if (d.type === TYPE_HELM_RELEASE) {
    const data: TopologyDataObject = model.topology[d.id] || dataObjectFromModel(d);
    data.groupResources = d.nodes.map((id) => model.topology[id]);

    return {
      width: HELM_GROUP_WIDTH,
      height: HELM_GROUP_HEIGHT,
      id: d.id,
      group: true,
      type: d.type,
      visible: true,
      collapsed: filters && !filters.display.helmGrouping,
      data,
      children: d.nodes,
      label: d.name,
      style: {
        padding: HELM_GROUP_PADDING,
      },
    };
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getHelmNodeModel = (d: Node, model: DataModel, filters: Filters): NodeModel => {
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getHelmEdgeModel = (d: Edge, model: DataModel, filters: Filters): EdgeModel => {
  return null;
};
