import { NodeModel, EdgeModel } from '@console/topology';
import { TopologyFilters as Filters } from '../filters/filter-utils';
import {
  TopologyDataModel as DataModel,
  TopologyDataObject,
  Node,
  Group,
  Edge,
} from '../topology-types';
import {
  TYPE_OPERATOR_BACKED_SERVICE,
  OPERATOR_GROUP_WIDTH,
  OPERATOR_GROUP_HEIGHT,
  OPERATOR_GROUP_PADDING,
} from './components/const';
import { dataObjectFromModel } from '../data-transforms';
import { NodeShape } from '@console/topology/src/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getOperatorGroupModel = (d: Group, model: DataModel, filters: Filters): NodeModel => {
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getOperatorNodeModel = (d: Node, model: DataModel, filters: Filters): NodeModel => {
  if (d.type === TYPE_OPERATOR_BACKED_SERVICE) {
    const data: TopologyDataObject = model.topology[d.id] || dataObjectFromModel(d);
    data.groupResources = d.children && d.children.map((id) => model.topology[id]);
    return {
      width: OPERATOR_GROUP_WIDTH,
      height: OPERATOR_GROUP_HEIGHT,
      id: d.id,
      type: d.type,
      label: model.topology[d.id].name,
      data,
      visible: true,
      collapsed:
        filters && d.type === TYPE_OPERATOR_BACKED_SERVICE && !filters.display.operatorGrouping,
      children: d.children,
      group: true,
      shape: NodeShape.rect,
      style: {
        padding: OPERATOR_GROUP_PADDING,
      },
    };
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getOperatorEdgeModel = (d: Edge, model: DataModel, filters: Filters): EdgeModel => {
  return null;
};
