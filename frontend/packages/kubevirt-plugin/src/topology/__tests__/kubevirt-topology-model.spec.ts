import * as _ from 'lodash';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import { DEFAULT_TOPOLOGY_FILTERS } from '@console/dev-console/src/components/topology/redux/const';
import { TopologyFilters } from '@console/dev-console/src/components/topology/filters';
import {
  transformTopologyData,
  topologyModelFromDataModel,
} from '@console/dev-console/src/components/topology';
import { kubevirtResources } from './topology-kubevirt-test-data';
import { TYPE_VIRTUAL_MACHINE } from '../components/const';

describe('topology model ', () => {
  let filters: TopologyFilters;
  let mockResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(kubevirtResources as any);
    filters = _.cloneDeep(DEFAULT_TOPOLOGY_FILTERS);
  });

  it('should create nodes and edges for Virtual Machines', () => {
    const topologyTransformedData = transformTopologyData(mockResources, [
      'deployments',
      'deploymentConfigs',
    ]);
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    expect(newModel.nodes.filter((n) => n.type === TYPE_VIRTUAL_MACHINE)).toHaveLength(2);
    expect(newModel.edges).toHaveLength(2);
  });

  it('should not render virtual machines if corresponding filter returns false', () => {
    filters.display.virtualMachines = false;
    const topologyTransformedData = transformTopologyData(mockResources, [
      'deployments',
      'deploymentConfigs',
    ]);
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    const virtualMachines = newModel.nodes.filter((n) => n.type === TYPE_VIRTUAL_MACHINE);
    const visibleVMs = virtualMachines.filter((n) => n.visible);
    expect(virtualMachines.length).toBe(2);
    expect(visibleVMs.length).toBe(0);
  });

  it('should render virtual machines if corresponding filter returns true', () => {
    const topologyTransformedData = transformTopologyData(mockResources, [
      'deployments',
      'deploymentConfigs',
    ]);
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    const virtualMachines = newModel.nodes.filter((n) => n.type === TYPE_VIRTUAL_MACHINE);
    const visibleVMs = virtualMachines.filter((n) => n.visible);
    expect(virtualMachines.length).toBe(2);
    expect(visibleVMs.length).toBe(2);
  });
});
