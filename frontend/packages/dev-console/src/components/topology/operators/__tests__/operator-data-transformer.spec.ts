import * as _ from 'lodash';
import { getImageForCSVIcon, ALL_APPLICATIONS_KEY } from '@console/shared';
import { Model, NodeModel } from '@patternfly/react-topology';
import { WorkloadData, TopologyDataResources } from '../../topology-types';
import { MockResources, TEST_KINDS_MAP } from '../../__tests__/topology-test-data';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../components/const';
import { DEFAULT_TOPOLOGY_FILTERS, EXPAND_GROUPS_FILTER_ID } from '../../filters/const';
import { getOperatorTopologyDataModel } from '../operators-data-transformer';
import {
  baseDataModelGetter,
  getWorkloadResources,
  updateModelFromFilters,
} from '../../data-transforms';
import { WORKLOAD_TYPES } from '../../topology-utils';
import {
  applyOperatorDisplayOptions,
  EXPAND_OPERATORS_RELEASE_FILTER,
  getTopologyFilters,
} from '../operatorFilters';
import { getFilterById } from '../../filters';

const filterers = [applyOperatorDisplayOptions];

const getTransformedTopologyData = (mockData: TopologyDataResources) => {
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, WORKLOAD_TYPES);
  return getOperatorTopologyDataModel('test-project', mockData, workloadResources).then((model) => {
    return baseDataModelGetter(model, 'test-project', mockData, workloadResources, []);
  });
};

const getNodeById = (id: string, graphData: Model): NodeModel => {
  return graphData.nodes.find((n) => n.id === id);
};

const getNodeByName = (name: string, graphData: Model): NodeModel => {
  return graphData.nodes.find((n) => n.label === name);
};

describe('operator data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
  });

  it('should return graph nodes for operator backed services', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    const operatorBackedServices = _.filter(graphData.nodes, {
      type: TYPE_OPERATOR_BACKED_SERVICE,
    });
    expect(operatorBackedServices).toHaveLength(1);
    expect(getNodeById(operatorBackedServices[0].id, graphData).type).toBe(
      TYPE_OPERATOR_BACKED_SERVICE,
    );
    expect(graphData.nodes.filter((n) => !n.group)).toHaveLength(10);
    expect(graphData.nodes.filter((n) => n.group)).toHaveLength(3);
    expect(graphData.edges).toHaveLength(1);
  });

  it('should return csv icon for operator backed service', async () => {
    const icon = _.get(mockResources.clusterServiceVersions.data[0], 'spec.icon.0');
    const csvIcon = getImageForCSVIcon(icon);
    const graphData = await getTransformedTopologyData(mockResources);

    const node = getNodeByName('jaeger-all-in-one-inmemory', graphData);
    expect((node.data.data as WorkloadData).builderImage).toBe(csvIcon);
  });

  it('should flag operator groups as collapsed when display filter is set', async () => {
    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    const topologyTransformedData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_OPERATORS_RELEASE_FILTER, filters).value = false;
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(3);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(1);
  });

  it('should flag operator groups as collapsed when all groups are collapsed', async () => {
    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    const topologyTransformedData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_OPERATORS_RELEASE_FILTER, filters).value = true;
    getFilterById(EXPAND_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(3);
    expect(
      newModel.nodes.filter((n) => n.type === TYPE_OPERATOR_BACKED_SERVICE && n.collapsed).length,
    ).toBe(1);
  });
});
