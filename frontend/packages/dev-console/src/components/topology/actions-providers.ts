import { KebabOption } from '@console/internal/components/utils';
import { GraphElementType, TopologyDataMap } from './topology-types';
import { workloadActions } from './actions/workloadActions';

export class ActionProviders {
  private readonly topology: TopologyDataMap;

  constructor(topology: TopologyDataMap) {
    this.topology = topology;
  }

  public getNodeActions = (nodeId: string): KebabOption[] => {
    const node = this.topology[nodeId];
    switch (node.type) {
      case 'workload':
        return workloadActions(node);
      default:
        return null;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  public getEdgeActions = (edgeId: string): KebabOption[] => null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  public getGroupActions = (groupId: string): KebabOption[] => null;

  public getActions = (type: GraphElementType, id: string) => {
    switch (type) {
      case GraphElementType.node:
        return this.getNodeActions(id);
      case GraphElementType.edge:
        return this.getEdgeActions(id);
      case GraphElementType.group:
        return this.getGroupActions(id);
      default:
        return null;
    }
  };
}
