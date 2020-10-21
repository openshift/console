import * as _ from 'lodash';
import {
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
} from '@console/knative-plugin/src/utils/get-knative-resources';
import { getPodStatus, podStatus } from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { WorkloadData, TopologyDataResources, TopologyDataMap } from '../../topology-types';
import { TYPE_TRAFFIC_CONNECTOR, TYPE_SERVICE_BINDING } from '../../components/const';
import { getTopologyEdgeItems } from '../transform-utils';
import { getTrafficConnectors, transformTopologyData } from '../data-transformer';
import { getEditURL } from '../../topology-utils';
import {
  resources,
  topologyData,
  MockResources,
  sampleDeployments,
  MockKialiGraphData,
  sampleHelmResourcesMap,
} from '../../__tests__/topology-test-data';
import {
  sbrBackingServiceSelector,
  sbrBackingServiceSelectors,
} from '../../__tests__/service-binding-test-data';

export function getTranformedTopologyData(
  mockData: TopologyDataResources,
  transformByProp: string[],
) {
  const result = transformTopologyData(
    mockData,
    transformByProp,
    [getKnativeServingRevisions, getKnativeServingConfigurations, getKnativeServingRoutes],
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

describe('data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
  });

  it('should be able to create an object', () => {
    expect(transformTopologyData(resources, ['deployments'])).toBeTruthy();
  });

  it('should return graph and topology data', () => {
    expect(transformTopologyData(resources, ['deployments'])).toEqual(topologyData);
  });

  it('should return graph and topology data only for the deployment kind', () => {
    const totalNodes =
      mockResources.deployments.data.length + mockResources.clusterServiceVersions.data.length;
    const { graphData, keys } = getTranformedTopologyData(mockResources, ['deployments']);
    expect(graphData.nodes).toHaveLength(totalNodes); // should contain only two deployment
    expect(keys).toHaveLength(totalNodes); // should contain only two deployment
  });

  it('should contain edges information for the deployment kind', () => {
    const { graphData } = getTranformedTopologyData(mockResources, ['deployments']);
    // check if edges are connected between analytics -> wit
    expect(graphData.edges.length).toEqual(1); // should contain only one edges
    expect(graphData.edges[0].source).toEqual(mockResources.deployments.data[0].metadata.uid); // analytics
    expect(graphData.edges[0].target).toEqual(mockResources.deployments.data[1].metadata.uid); // wit
  });

  it('should return graph and topology data only for the deploymentConfig kind', () => {
    const { graphData, keys } = getTranformedTopologyData(mockResources, ['deploymentConfigs']);
    expect(graphData.nodes.length).toEqual(mockResources.deploymentConfigs.data.length); // should contain only two deployment
    expect(keys.length).toEqual(mockResources.deploymentConfigs.data.length); // should contain only two deployment
  });

  it('should not have group information if the `part-of` label is missing', () => {
    const { graphData } = getTranformedTopologyData(mockResources, ['deploymentConfigs']);
    expect(graphData.groups).toHaveLength(0);
  });

  it('should match the previous snapshot', () => {
    expect(
      transformTopologyData(mockResources, ['deployments', 'deploymentConfigs']),
    ).toMatchSnapshot();
  });

  it('should return a valid pod status', () => {
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    const itemKey = getKeyForName('nodejs', keys, topologyTransformedData);
    const status = getPodStatus(
      (topologyTransformedData[itemKey].data as WorkloadData).donutStatus.pods[0],
    );
    expect(podStatus.includes(status)).toBe(true);
  });

  it('should return empty pod list in TopologyData in case of no pods', () => {
    const knativeMockResp = { ...mockResources, pods: { loaded: true, loadError: '', data: [] } };
    const { topologyTransformedData, keys } = getTranformedTopologyData(knativeMockResp, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      0,
    );
  });

  it('should return a Idle pod status in a non-serverless application', () => {
    // simulate pod are scaled to zero in nodejs deployment.
    mockResources = {
      ..._.cloneDeep(mockResources),
      pods: { loaded: true, loadError: '', data: [] },
    };
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
    expect(status).toEqual('Idle');
  });

  it('should return false for non knative resource', () => {
    mockResources = { ...mockResources, pods: { loaded: true, loadError: '', data: [] } };
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).isKnativeResource).toBeFalsy();
  });

  it('should return a valid daemon set', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(mockResources, [
      'daemonSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect(topologyTransformedData[keys[0]].resources.obj.kind).toEqual('DaemonSet');
  });
  it('should return a daemon set pod ', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(mockResources, [
      'daemonSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      1,
    );
  });

  it('should return a valid stateful set', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(mockResources, [
      'statefulSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect(topologyTransformedData[keys[0]].resources.obj.kind).toEqual('StatefulSet');
  });
  it('should return a stateful set pod ', () => {
    const { topologyTransformedData, graphData, keys } = getTranformedTopologyData(mockResources, [
      'statefulSets',
    ]);
    expect(graphData.nodes).toHaveLength(1);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).donutStatus.pods).toHaveLength(
      1,
    );
  });

  it('should return a valid che workspace factory URL if cheURL is there', () => {
    const mockCheURL = 'https://mock-che.test-cluster.com';
    const mockGitURL =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-uri'];
    const mockGitBranch =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-ref'];
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
    ]);
    const generatedEditURL = getEditURL(mockGitURL, mockGitBranch, mockCheURL);
    const { editURL, vcsURI, vcsRef } = topologyTransformedData[keys[0]].data as WorkloadData;
    const editUrl = editURL || getEditURL(vcsURI, vcsRef, mockCheURL);

    expect(editUrl).toBe(generatedEditURL);
  });

  it('should return the git repo URL if cheURL is not there', () => {
    const mockGitURL =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-uri'];
    const mockGitBranch =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-ref'];
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
    ]);
    const { vcsURI, vcsRef } = topologyTransformedData[keys[0]].data as WorkloadData;
    const editUrl = getEditURL(vcsURI, vcsRef, '');
    expect(editUrl).toBe(`${mockGitURL}/tree/${mockGitBranch}`);
  });

  it('should return only the git repo URL if branch name is not provided', () => {
    const mockGitURL =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-uri'];
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
    ]);
    const { vcsURI } = topologyTransformedData[keys[0]].data as WorkloadData;
    const editUrl = getEditURL(vcsURI, '', '');
    expect(editUrl).toBe(mockGitURL);
  });

  it('should return builder image icon for nodejs', () => {
    const nodejsIcon = getImageForIconClass('icon-nodejs');
    const { topologyTransformedData, keys } = getTranformedTopologyData(mockResources, [
      'deploymentConfigs',
    ]);
    expect((topologyTransformedData[keys[0]].data as WorkloadData).builderImage).toBe(nodejsIcon);
  });

  it('should create a connector using kiali graph data', () => {
    const expectedEdgeId = `5ca9ae28-680d-11e9-8c69-5254003f9382_60a9b423-680d-11e9-8c69-5254003f9382`;
    const edges = getTrafficConnectors(MockKialiGraphData, [...sampleDeployments.data]);
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toEqual(expectedEdgeId);
  });

  it('should not create a connector if kiali graph node data doesnt match any on the resource name', () => {
    const nodeData = MockKialiGraphData.nodes;
    const kialiData = {
      nodes: [
        {
          data: {
            ...nodeData[0].data,
            workload: 'a',
          },
        },
        {
          data: {
            ...nodeData[1].data,
            workload: 'b',
          },
        },
      ],
      edges: MockKialiGraphData.edges,
    };
    const edges = getTrafficConnectors(kialiData, [...sampleDeployments.data]);
    expect(edges).toHaveLength(0);
  });

  it('should not have connector of TYPE_TRAFFIC_CONNECTOR if there is not traffic data', () => {
    const { graphData } = getTranformedTopologyData(mockResources, ['deployments']);
    expect(graphData.edges).toHaveLength(1);
    expect(graphData.edges[0].type).not.toEqual(TYPE_TRAFFIC_CONNECTOR);
  });

  it('should add a traffic connector when kiali data is passed through trafficData', () => {
    const transformedData = transformTopologyData(mockResources, null, null, MockKialiGraphData);
    expect(transformedData.graph.edges).toHaveLength(1);
    expect(transformedData.graph.edges[0].type).toEqual(TYPE_TRAFFIC_CONNECTOR);
  });

  it('should support single  binding service selectors', () => {
    const testResources = sbrBackingServiceSelector.deployments.data;
    const deployments = sbrBackingServiceSelector.deployments.data;
    const sbrs = sbrBackingServiceSelector.serviceBindingRequests.data;
    expect(getTopologyEdgeItems(deployments[0], testResources, sbrs)).toEqual([
      {
        id: `uid-app_uid-db-1`,
        type: TYPE_SERVICE_BINDING,
        source: 'uid-app',
        target: 'uid-db-1',
        data: { sbr: sbrs[0] },
      },
    ]);
  });

  it('should support multiple binding service selectors', () => {
    const testResources = sbrBackingServiceSelectors.deployments.data;
    const deployments = sbrBackingServiceSelectors.deployments.data;
    const sbrs = sbrBackingServiceSelectors.serviceBindingRequests.data;
    expect(getTopologyEdgeItems(deployments[0], testResources, sbrs)).toEqual([
      {
        id: `uid-app_uid-db-1`,
        type: TYPE_SERVICE_BINDING,
        source: 'uid-app',
        target: 'uid-db-1',
        data: { sbr: sbrs[0] },
      },
      {
        id: `uid-app_uid-db-2`,
        type: TYPE_SERVICE_BINDING,
        source: 'uid-app',
        target: 'uid-db-2',
        data: { sbr: sbrs[0] },
      },
    ]);
  });
});
