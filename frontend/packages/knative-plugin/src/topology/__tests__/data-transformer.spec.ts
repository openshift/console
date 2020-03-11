import * as _ from 'lodash';
import * as k8s from '@console/internal/module/k8s';
import { getPodStatus, podStatus } from '@console/shared';
import {
  TopologyDataResources,
  WorkloadData,
  transformTopologyData,
} from '@console/dev-console/src/components/topology';
import { MockKnativeResources, sampleKnativeDeployments } from './topology-knative-test-data';
import {
  sampleEventSourceApiServer,
  sampleEventSourceDeployments,
} from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { sampleDeployments } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import { filterNonKnativeDeployments } from '../data-transformer';

export function getTranformedTopologyData(
  mockData: TopologyDataResources,
  transformByProp: string[],
) {
  const result = transformTopologyData(mockData, transformByProp);
  const topologyTransformedData = result.topology;
  const graphData = result.graph;
  return { topologyTransformedData, graphData, keys: Object.keys(topologyTransformedData) };
}

describe('knative data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockKnativeResources);
  });

  it('should return a valid pod status for scale to 0', () => {
    const { topologyTransformedData } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const status = getPodStatus(
      (topologyTransformedData['02c34a0e-9638-11e9-b134-06a61d886b62'].data as WorkloadData)
        .donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
    expect(status).toEqual('Autoscaled to 0');
  });

  it('should return true for knative resource', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).isKnativeResource).toBeTruthy();
  });

  it('should return knative routes for knative resource', () => {
    const { topologyTransformedData } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect(
      (topologyTransformedData['cea9496b-8ce0-11e9-bb7b-0ebb55b110b8'].data as WorkloadData).url,
    ).toEqual('http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com');
  });

  it('should return revision resources for knative workloads', () => {
    const { topologyTransformedData } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const revRes =
      topologyTransformedData['cea9496b-8ce0-11e9-bb7b-0ebb55b110b8'].resources.revisions;
    expect(revRes.length).toEqual(1);
  });

  it('should return Configuration resources for knative workloads', () => {
    const { topologyTransformedData } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const configRes =
      topologyTransformedData['cea9496b-8ce0-11e9-bb7b-0ebb55b110b8'].resources.configurations;
    expect(configRes).toHaveLength(1);
  });

  it('should filter out deployments created for knative resources and event sources', () => {
    const MockResources: k8s.DeploymentKind[] = [
      sampleEventSourceDeployments.data[0],
      sampleKnativeDeployments.data[0],
      sampleDeployments.data[0],
    ];
    const filteredResources: k8s.DeploymentKind[] = filterNonKnativeDeployments(MockResources, [
      sampleEventSourceApiServer.data[0],
    ]);
    expect(filteredResources).toHaveLength(1);
    expect(filteredResources[0].metadata.name).toEqual('analytics-deployment');
  });
});
