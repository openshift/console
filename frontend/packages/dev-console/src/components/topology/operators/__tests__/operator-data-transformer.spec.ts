import * as _ from 'lodash';
import { getImageForCSVIcon } from '@console/shared';
import { WorkloadData, TopologyDataResources, TopologyDataMap } from '../../topology-types';
import { transformTopologyData } from '../../data-transforms/data-transformer';
import { MockResources, sampleHelmResourcesMap } from '../../__tests__/topology-test-data';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../components/const';

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

function getKeyForName(name: string, keys: string[], topologyTransformedData: TopologyDataMap) {
  return keys.find((key) => topologyTransformedData[key].resources.obj.metadata.name === name);
}

describe('operator data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
  });

  it('should return graph nodes for operator backed services', () => {
    const totalNodes =
      mockResources.deployments.data.length + mockResources.clusterServiceVersions.data.length;
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(mockResources, [
      'deployments',
    ]);
    const operatorBackedServices = _.filter(graphData.nodes, {
      type: TYPE_OPERATOR_BACKED_SERVICE,
    });
    expect(operatorBackedServices).toHaveLength(1);
    expect(topologyTransformedData[operatorBackedServices[0].id].type).toBe(
      TYPE_OPERATOR_BACKED_SERVICE,
    );
    expect(keys).toHaveLength(totalNodes);
  });

  it('should return csv icon for operator backed service', () => {
    const icon = _.get(mockResources.clusterServiceVersions.data[0], 'spec.icon.0');
    const csvIcon = getImageForCSVIcon(icon);
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deployments',
    ]);

    const itemKey = getKeyForName('jaeger-all-in-one-inmemory', keys, topologyTransformedData);
    expect((topologyTransformedData[itemKey].data as WorkloadData).builderImage).toBe(csvIcon);
  });
});
