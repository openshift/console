import * as _ from 'lodash';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import {
  MockResources,
  sampleDeploymentConfigs,
} from '@console/shared/src/utils/__tests__/test-resource-data';
import {
  sampleHelmChartDeploymentConfig,
  sampleHelmResourcesMap,
  TEST_KINDS_MAP,
} from '@console/topology/src/__tests__/topology-test-data';
import { baseDataModelGetter } from '@console/topology/src/data-transforms/data-transformer';
import { getWorkloadResources } from '@console/topology/src/data-transforms/transform-utils';
import { updateModelFromFilters } from '@console/topology/src/data-transforms/updateModelFromFilters';
import { getFilterById } from '@console/topology/src/filters';
import {
  DEFAULT_TOPOLOGY_FILTERS,
  EXPAND_GROUPS_FILTER_ID,
  SHOW_GROUPS_FILTER_ID,
} from '@console/topology/src/filters/const';
import {
  TopologyDataResources,
  TopologyDisplayFilterType,
} from '@console/topology/src/topology-types';
import { WORKLOAD_TYPES } from '@console/topology/src/utils/topology-utils';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from '../components/const';
import {
  getHelmGraphModelFromMap,
  getTopologyHelmReleaseGroupItem,
  isHelmReleaseNode,
} from '../helm-data-transformer';
import {
  applyHelmDisplayOptions,
  EXPAND_HELM_RELEASE_FILTER,
  getTopologyFilters,
} from '../helmFilters';

const filterers = [applyHelmDisplayOptions];

export function getTransformedTopologyData(mockData: TopologyDataResources) {
  const dc = _.cloneDeep(sampleDeploymentConfigs.data[0]);
  dc.metadata.labels = {
    app: 'nodejs',
    'app.kubernetes.io/part-of': 'app-1',
  };
  const fireHoseDcs = {
    ...sampleDeploymentConfigs,
    data: [dc, sampleHelmChartDeploymentConfig],
  };
  const data = { ...mockData, deploymentConfigs: fireHoseDcs };

  const workloadResources = getWorkloadResources(data, TEST_KINDS_MAP, WORKLOAD_TYPES);
  const model = getHelmGraphModelFromMap(sampleHelmResourcesMap, data);
  return baseDataModelGetter(model, 'test-project', data, workloadResources, []);
}

describe('HELM data transformer ', () => {
  let mockResources: TopologyDataResources;
  let filters;
  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
    filters = _.cloneDeep(DEFAULT_TOPOLOGY_FILTERS);
    filters.push(...getTopologyFilters());
  });

  it('should add to groups with helm grouping type for a helm chart node', () => {
    const groups = getTopologyHelmReleaseGroupItem(
      sampleDeploymentConfigs.data[0],
      sampleHelmResourcesMap,
      [],
    );
    expect(groups).toHaveLength(0);
    const groups2 = getTopologyHelmReleaseGroupItem(
      sampleHelmChartDeploymentConfig,
      sampleHelmResourcesMap,
      [],
    );
    expect(groups2).toHaveLength(1);
    expect(groups2[0].type).toEqual(TYPE_HELM_RELEASE);
  });

  it('should group into Application or Helm based on the checks on label', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    expect(graphData.nodes.filter((n) => n.group)).toHaveLength(4);
    expect(graphData.nodes.filter((n) => n.group && n.type === TYPE_HELM_RELEASE)).toHaveLength(1);
  });

  it('should flag helm groups as collapsed when display filter is set', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_HELM_RELEASE_FILTER, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.group)).toHaveLength(4);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed)).toHaveLength(1);
  });

  it('should flag helm groups as collapsed when all groups are collapsed', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_HELM_RELEASE_FILTER, filters).value = true;
    getFilterById(EXPAND_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.group)).toHaveLength(4);
    expect(newModel.nodes.filter((n) => n.type === TYPE_HELM_RELEASE && n.collapsed)).toHaveLength(
      1,
    );
  });

  it('should flag not show helm groups when show groups is false', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(SHOW_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.type === TYPE_HELM_RELEASE)).toHaveLength(0);
  });

  it('should show helm releases and their children when filtered by HelmRelease', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    filters.push({
      type: TopologyDisplayFilterType.kind,
      id: 'HelmRelease',
      label: 'HelmRelease',
      priority: 1,
      value: true,
    });
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.type === TYPE_HELM_RELEASE)).toHaveLength(1);
    expect(newModel.nodes.filter((n) => n.type === TYPE_HELM_WORKLOAD)).toHaveLength(1);
  });

  it('should return true for nodes created by helm charts', () => {
    expect(isHelmReleaseNode(sampleDeploymentConfigs.data[0], sampleHelmResourcesMap)).toBe(false);
    expect(isHelmReleaseNode(sampleHelmChartDeploymentConfig, sampleHelmResourcesMap)).toBe(true);
  });
});
