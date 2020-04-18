import { NodeModel, EdgeModel } from '@console/topology';
import {
  TopologyFilters as Filters,
  TopologyDataModel as DataModel,
  TopologyDataObject,
  Node,
  Group,
  Edge,
  dataObjectFromModel,
  NODE_HEIGHT,
  NODE_PADDING,
  NODE_WIDTH,
} from '@console/dev-console/src/components/topology';
import { TYPE_VIRTUAL_MACHINE } from './components/const';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getKubevirtGroupModel = (d: Group, model: DataModel, filters: Filters): NodeModel => {
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getKubevirtNodeModel = (d: Node, model: DataModel, filters: Filters): NodeModel => {
  if (d.type === TYPE_VIRTUAL_MACHINE) {
    const data: TopologyDataObject = model.topology[d.id] || dataObjectFromModel(d);
    const hidden = filters && !filters.display.virtualMachines;
    return {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      id: d.id,
      type: d.type,
      label: model.topology[d.id].name,
      data,
      visible: !hidden,
      style: {
        padding: NODE_PADDING,
      },
    };
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getKubevirtEdgeModel = (d: Edge, model: DataModel, filters: Filters): EdgeModel => {
  return null;
};
