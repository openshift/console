import * as _ from 'lodash';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { TopologyDataResources } from '../../topology-types';
import {
  getHelmGraphModelFromMap,
  getTopologyHelmReleaseGroupItem,
} from '../helm-data-transformer';
import {
  MockResources,
  sampleHelmChartDeploymentConfig,
  sampleDeploymentConfigs,
  sampleHelmResourcesMap,
  TEST_KINDS_MAP,
} from '../../__tests__/topology-test-data';
import { TYPE_HELM_RELEASE } from '../components/const';
import { DEFAULT_TOPOLOGY_FILTERS } from '../../filters/const';
import {
  baseDataModelGetter,
  getWorkloadResources,
  updateModelFromFilters,
} from '../../data-transforms';
import {
  applyHelmDisplayOptions,
  EXPAND_HELM_RELEASE_FILTER,
  getTopologyFilters,
} from '../helmFilters';
import { WORKLOAD_TYPES } from '../../topology-utils';
import { getFilterById } from '../../filters';

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

  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
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
    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_HELM_RELEASE_FILTER, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.group)).toHaveLength(4);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed)).toHaveLength(1);
  });
});
