import * as _ from 'lodash';
import {
  topologyDataModel,
  dataModel,
  MockResources,
  TEST_KINDS_MAP,
} from '../../__tests__/topology-test-data';
import { updateModelFromFilters } from '../updateModelFromFilters';
import { EXPAND_GROUPS_FILTER_ID, getFilterById, SHOW_GROUPS_FILTER_ID } from '../../filters';
import { DEFAULT_TOPOLOGY_FILTERS, EXPAND_APPLICATION_GROUPS_FILTER_ID } from '../../filters/const';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import { baseDataModelGetter } from '../data-transformer';
import { getWorkloadResources } from '../transform-utils';
import { WORKLOAD_TYPES } from '../../topology-utils';
import { DisplayFilters } from '../../topology-types';

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
    expect(topologyTransformedData.nodes.filter((n) => !n.group)).toHaveLength(10);
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
    expect(newModel.nodes.filter((n) => !n.group).length).toBe(10);
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
    getFilterById(SHOW_GROUPS_FILTER_ID, filters).value = true;
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

  it('should show no groups when show groups is false', () => {
    const topologyTransformedData = getTransformedTopologyData();
    getFilterById(EXPAND_GROUPS_FILTER_ID, filters).value = true;
    getFilterById(SHOW_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel.nodes.filter((n) => !n.group).length).toBe(10);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(0);
  });

  it('should show all nodes when is false and expand groups is false', () => {
    const topologyTransformedData = getTransformedTopologyData();
    getFilterById(EXPAND_GROUPS_FILTER_ID, filters).value = false;
    getFilterById(SHOW_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(
      topologyTransformedData,
      filters,
      ALL_APPLICATIONS_KEY,
      filterers,
    );
    expect(newModel.nodes.filter((n) => !n.group).length).toBe(10);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(0);
  });
});
