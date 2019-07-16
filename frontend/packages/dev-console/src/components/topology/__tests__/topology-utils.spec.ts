import { TransformTopologyData, getPodStatus, podStatus } from '../topology-utils';
import { resources, topologyData, MockResources } from './topology-test-data';
import { MockKnativeResources } from './topology-knative-test-data';
import { WorkloadData } from '../topology-types';

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
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();

    expect(result.graph.nodes).toHaveLength(MockResources.deployments.data.length); // should contain only two deployment
    expect(Object.keys(result.topology)).toHaveLength(MockResources.deployments.data.length); // should contain only two deployment
  });

  it('should contain edges information for the deployment kind', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    // check if edges are connected between analytics -> wit
    expect(result.graph.edges.length).toEqual(1); // should contain only one edges
    expect(result.graph.edges[0].source).toEqual(MockResources.deployments.data[0].metadata.uid); // analytics
    expect(result.graph.edges[0].target).toEqual(MockResources.deployments.data[1].metadata.uid); // wit
  });

  it('should return graph and topology data only for the deploymentConfig kind', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    const result = transformTopologyData.getTopologyData();

    expect(result.graph.nodes.length).toEqual(MockResources.deploymentConfigs.data.length); // should contain only two deployment
    expect(Object.keys(result.topology).length).toEqual(
      MockResources.deploymentConfigs.data.length,
    ); // should contain only two deployment
  });

  it('should not have group information if the `part-of` label is missing', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    const result = transformTopologyData.getTopologyData();
    expect(result.graph.groups).toHaveLength(0);
  });

  it('should match the previous snapshot', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    expect(result).toMatchSnapshot();
  });

  it('should return a valid pod status', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    const status = getPodStatus(
      (topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
  });

  it('should return empty pod list in TopologyData in case of no pods', () => {
    const knativeMockResp = { ...MockResources, pods: { data: [] } };
    const transformTopologyData = new TransformTopologyData(knativeMockResp);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
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
    const transformTopologyData = new TransformTopologyData(mockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    const status = getPodStatus(
      (topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
    expect(status).toEqual('Scaled to 0');
  });

  it('should return false for non knative resource', () => {
    const mockResources = { ...MockResources, pods: { data: [] } };
    const transformTopologyData = new TransformTopologyData(mockResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).isKnativeResource).toBeFalsy();
  });

  it('should return a valid pod status for scale to 0', () => {
    const transformTopologyData = new TransformTopologyData(MockKnativeResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    const status = getPodStatus(
      (topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
    expect(status).toEqual('Scaled to 0');
  });

  it('should return true for knative resource', () => {
    const transformTopologyData = new TransformTopologyData(MockKnativeResources);
    transformTopologyData.transformDataBy('deploymentConfigs');
    transformTopologyData.transformDataBy('deployments');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).isKnativeResource).toBeTruthy();
  });

  it('should return a valid daemon set', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('daemonSets');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    expect(result.graph.nodes).toHaveLength(1);
    expect(topologyTransformedData[keys[0]].resources[0].kind).toEqual('DaemonSet');
  });
  it('should return a daemon set pod ', () => {
    const transformTopologyData = new TransformTopologyData(MockResources);
    transformTopologyData.transformDataBy('daemonSets');
    const result = transformTopologyData.getTopologyData();
    const topologyTransformedData = result.topology;
    const keys = Object.keys(topologyTransformedData);
    expect(result.graph.nodes).toHaveLength(1);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      1,
    );
  });
});
