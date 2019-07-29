import { TransformTopologyData, getPodStatus, podStatus } from '../topology-utils';
import { WorkloadData, TopologyDataResources } from '../topology-types';
import { resources, topologyData, MockResources } from './topology-test-data';
import { MockKnativeResources } from './topology-knative-test-data';

function getTranformedTopologyData(mockData: TopologyDataResources, transformByProp: string[]) {
  const transformTopologyData = new TransformTopologyData(mockData);
  transformByProp.forEach((t) => transformTopologyData.transformDataBy(t));
  const result = transformTopologyData.getTopologyData();
  const topologyTransformedData = result.topology;
  const graphData = result.graph;
  return { topologyTransformedData, graphData, keys: Object.keys(topologyTransformedData) };
}

describe('TopologyUtils ', () => {
  it('should be able to create an object', () => {
    const transformTopologyData = new TransformTopologyData(resources);
    expect(transformTopologyData).toBeTruthy();
  });

  it('should have the resources object as a public member', () => {
    const transformTopologyData = new TransformTopologyData(resources);
    expect(transformTopologyData.resources).toEqual(resources);
  });

  it('should throw an error, if the invalid target deployment string is provided', () => {
    const transformTopologyData = new TransformTopologyData(resources);
    const invalidTargetDeployment = 'dconfig'; // valid values are 'deployments' or 'deploymentConfigs'
    expect(() => {
      transformTopologyData.transformDataBy(invalidTargetDeployment);
    }).toThrowError(`Invalid target deployment resource: (${invalidTargetDeployment})`);
  });

  it('should not throw an error, if the valid target deployment string is provided', () => {
    const transformTopologyData = new TransformTopologyData(resources);
    const validTargetDeployment = 'deployments'; // valid values are 'deployments' or 'deploymentConfigs'
    expect(() => {
      transformTopologyData.transformDataBy(validTargetDeployment);
    }).not.toThrowError(`Invalid target deployment resource: (${validTargetDeployment})`);
  });
  it('should return graph and topology data', () => {
    const transformTopologyData = new TransformTopologyData(resources);
    transformTopologyData.transformDataBy('deployments');
    expect(transformTopologyData.getTopologyData()).toEqual(topologyData);
  });
  it('should return graph and topology data only for the deployment kind', () => {
    const { graphData, keys } = getTranformedTopologyData(MockResources, ['deployments']);
    expect(graphData.nodes).toHaveLength(MockResources.deployments.data.length); // should contain only two deployment
    expect(keys).toHaveLength(MockResources.deployments.data.length); // should contain only two deployment
  });

  it('should contain edges information for the deployment kind', () => {
    const { graphData } = getTranformedTopologyData(MockResources, ['deployments']);
    // check if edges are connected between analytics -> wit
    expect(graphData.edges.length).toEqual(1); // should contain only one edges
    expect(graphData.edges[0].source).toEqual(MockResources.deployments.data[0].metadata.uid); // analytics
    expect(graphData.edges[0].target).toEqual(MockResources.deployments.data[1].metadata.uid); // wit
  });

  it('should return graph and topology data only for the deploymentConfig kind', () => {
    const { graphData, keys } = getTranformedTopologyData(MockResources, ['deploymentConfigs']);
    expect(graphData.nodes.length).toEqual(MockResources.deploymentConfigs.data.length); // should contain only two deployment
    expect(keys.length).toEqual(MockResources.deploymentConfigs.data.length); // should contain only two deployment
  });

  it('should not have group information if the `part-of` label is missing', () => {
    const { graphData } = getTranformedTopologyData(MockResources, ['deploymentConfigs']);
    expect(graphData.groups).toHaveLength(0);
  });

  it('should match the previous snapshot', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    expect(result).toMatchSnapshot();
  });

  it('should return a valid pod status', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(MockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const status = getPodStatus(
      (topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
  });

  it('should return empty pod list in TopologyData in case of no pods', () => {
    const knativeMockResp = { ...MockResources, pods: { data: [] } };
    const { topologyTransformedData, keys } = getTranformedTopologyData(knativeMockResp, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      0,
    );
  });

  it('should return a Scaled to zero pod status in a non-serverless application', () => {
    // simulate pod are scaled to zero in nodejs deployment.
    const mockResources = { ...MockResources, pods: { data: [] } };
    mockResources.deploymentConfigs.data[0].metadata.annotations = {
      'idling.alpha.openshift.io/idled-at': '2019-04-22T11:58:33Z',
    };
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
    ]);
    const status = getPodStatus(
      (topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
    expect(status).toEqual('Scaled to 0');
  });

  it('should return false for non knative resource', () => {
    const mockResources = { ...MockResources, pods: { data: [] } };
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).isKnativeResource).toBeFalsy();
  });

  it('should return a valid pod status for scale to 0', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(MockKnativeResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const status = getPodStatus(
      (topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
    expect(status).toEqual('Scaled to 0');
  });

  it('should return true for knative resource', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(MockKnativeResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).isKnativeResource).toBeTruthy();
  });

  it('should return a valid daemon set', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(MockResources, [
      'daemonSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect(topologyTransformedData[keys[0]].resources[0].kind).toEqual('DaemonSet');
  });
  it('should return a daemon set pod ', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(MockResources, [
      'daemonSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      1,
    );
  });

  it('should return knative routes for knative resource', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(MockKnativeResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).url).toEqual(
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });

  it('should return revision resources for knative workloads', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(MockKnativeResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const revRes = topologyTransformedData[keys[0]].resources.filter(
      (item) =>
        item.kind &&
        item.kind === 'Revision' &&
        item.apiVersion &&
        item.apiVersion === 'serving.knative.dev/v1alpha1',
    );
    expect(revRes.length).toEqual(1);
  });

  it('should return Configuration resources for knative workloads', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(MockKnativeResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const configRes = topologyTransformedData[keys[0]].resources.filter(
      (item) =>
        item.kind &&
        item.kind === 'Configuration' &&
        item.apiVersion &&
        item.apiVersion === 'serving.knative.dev/v1alpha1',
    );
    expect(configRes).toHaveLength(1);
  });

  it('should return a valid stateful set', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(MockResources, [
      'statefulSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect(topologyTransformedData[keys[0]].resources[0].kind).toEqual('StatefulSet');
  });
  it('should return a stateful set pod ', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(MockResources, [
      'statefulSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      1,
    );
  });
});
