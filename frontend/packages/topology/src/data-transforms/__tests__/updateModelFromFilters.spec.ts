import * as _ from 'lodash';
import { referenceFor } from '@console/internal/module/k8s';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { MockResources } from '@console/shared/src/utils/__tests__/test-resource-data';
import { topologyDataModel, dataModel, TEST_KINDS_MAP } from '../../__tests__/topology-test-data';
import { TYPE_WORKLOAD } from '../../const';
import { EXPAND_GROUPS_FILTER_ID, getFilterById } from '../../filters';
import { DEFAULT_TOPOLOGY_FILTERS, EXPAND_APPLICATION_GROUPS_FILTER_ID } from '../../filters/const';
import { DisplayFilters, TopologyDisplayFilterType } from '../../topology-types';
import { WORKLOAD_TYPES } from '../../utils/topology-utils';
import { baseDataModelGetter } from '../data-transformer';
import { getWorkloadResources } from '../transform-utils';
import { updateModelFromFilters } from '../updateModelFromFilters';

const namespace = 'test-project';

const filterers = [];

function getTransformedTopologyData() {
  const model = { nodes: [], edges: [] };
  const workloadResources = getWorkloadResources(MockResources, TEST_KINDS_MAP, WORKLOAD_TYPES);

  return baseDataModelGetter(model, namespace, MockResources, workloadResources, []);
}

describe('topology model ', () => {
  let filters: DisplayFilters;

  beforeEach(() => {
    filters = _.cloneDeep(DEFAULT_TOPOLOGY_FILTERS);
  });

  it('should return topology model data', () => {
    const newModel = updateModelFromFilters(
      topologyDataModel,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel).toEqual(dataModel);
  });

  it('should have the correct nodes, groups, and edges when no filters', () => {
    const topologyTransformedData = getTransformedTopologyData();
    expect(topologyTransformedData.nodes.filter((n) => !n.group)).toHaveLength(11);
    expect(topologyTransformedData.nodes.filter((n) => n.group)).toHaveLength(2);
    expect(topologyTransformedData.edges).toHaveLength(1);
  });

  it('should hide nodes not in the filtered application', () => {
    const topologyTransformedData = getTransformedTopologyData();
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      'application-1',
      filterers,
    );
    expect(newModel.nodes.filter((n) => !n.group).length).toBe(11);
    expect(newModel.nodes.filter((n) => !n.group && n.visible).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group && n.visible).length).toBe(1);
  });

  it('should flag application groups as collapsed when display filter is set', () => {
    const topologyTransformedData = getTransformedTopologyData();
    getFilterById(EXPAND_APPLICATION_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(2);
  });

  it('should flag application groups as collapsed when expand groups is false', () => {
    const topologyTransformedData = getTransformedTopologyData();
    getFilterById(EXPAND_APPLICATION_GROUPS_FILTER_ID, filters).value = true;
    getFilterById(EXPAND_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(2);
  });

  it('should remove filtered kinds', () => {
    const topologyTransformedData = getTransformedTopologyData();
    filters.push({
      type: TopologyDisplayFilterType.kind,
      id: referenceFor(MockResources.deployments.data[0]),
      label: 'DeploymentConfig',
      priority: 1,
      value: true,
    });
    filters.push({
      type: TopologyDisplayFilterType.kind,
      id: referenceFor(MockResources.cronJobs.data[0]),
      label: 'DeploymentConfig',
      priority: 1,
      value: true,
    });
    const filteredModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(filteredModel.nodes.filter((n) => n.type === TYPE_WORKLOAD).length).toBe(
      MockResources.deployments.data.length + MockResources.cronJobs.data.length,
    );
  });
});
