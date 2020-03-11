import * as _ from 'lodash';
import { TopologyDataResources } from '../../topology-types';
import { transformTopologyData } from '../../data-transforms/data-transformer';
import { getTopologyHelmReleaseGroupItem } from '../helm-data-transformer';
import {
  MockResources,
  sampleHelmChartDeploymentConfig,
  sampleDeploymentConfigs,
  sampleHelmResourcesMap,
} from '../../__tests__/topology-test-data';
import { TYPE_HELM_RELEASE } from '../components/const';
import { TYPE_APPLICATION_GROUP } from '../../components';

export function getTranformedTopologyData(
  mockData: TopologyDataResources,
  transformByProp: string[],
) {
  const result = transformTopologyData(
    mockData,
    transformByProp,
    undefined,
    undefined,
    sampleHelmResourcesMap,
  );
  const topologyTransformedData = result.topology;
  const graphData = result.graph;
  return { topologyTransformedData, graphData, keys: Object.keys(topologyTransformedData) };
}

describe('HELM data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
  });

  it('should add to groups with helm grouping type for a helm chart node', () => {
    const { groups } = getTopologyHelmReleaseGroupItem(
      sampleDeploymentConfigs.data[0],
      sampleHelmResourcesMap,
      [],
    );
    expect(groups).toHaveLength(0);
    const { groups: groups2 } = getTopologyHelmReleaseGroupItem(
      sampleHelmChartDeploymentConfig,
      sampleHelmResourcesMap,
      [],
    );
    expect(groups2).toHaveLength(1);
    expect(groups2[0].type).toEqual(TYPE_HELM_RELEASE);
  });

  it('should group into Application or Helm based on the checks on label', () => {
    const dc = { ...sampleDeploymentConfigs.data[0] };
    dc.metadata.labels = {
      app: 'nodejs',
      'app.kubernetes.io/part-of': 'app-1',
    };
    const fireHoseDcs = {
      ...sampleDeploymentConfigs,
      data: [dc, sampleHelmChartDeploymentConfig],
    };
    const data = { ...mockResources, deploymentConfigs: fireHoseDcs };
    const { graphData } = getTranformedTopologyData(data, ['deploymentConfigs']);
    expect(graphData.groups).toHaveLength(2);
    expect(graphData.groups.filter((g) => g.type === TYPE_HELM_RELEASE)).toHaveLength(1);
    expect(graphData.groups.filter((g) => g.type === TYPE_APPLICATION_GROUP)).toHaveLength(1);
  });
});
