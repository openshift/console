import * as _ from 'lodash';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { WorkloadData, TopologyDataResources, TrafficData } from '../../topology-types';
import { TYPE_TRAFFIC_CONNECTOR } from '../../components/const';
import { getTrafficConnectors, baseDataModelGetter } from '../data-transformer';
import { getEditURL, WORKLOAD_TYPES } from '../../topology-utils';
import {
  resources,
  topologyData,
  MockBaseResources,
  sampleDeployments,
  MockKialiGraphData,
  TEST_KINDS_MAP,
} from '../../__tests__/topology-test-data';
import { getWorkloadResources } from '../transform-utils';

const namespace = 'test-project';

function getTransformedTopologyData(
  mockData: TopologyDataResources,
  transformByProp: string[] = WORKLOAD_TYPES,
  trafficData?: TrafficData,
) {
  WORKLOAD_TYPES.forEach((wt) => {
    if (!transformByProp.includes(wt)) {
      mockData[wt].data = [];
    }
  });

  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, transformByProp);
  const model = { nodes: [], edges: [] };

  return baseDataModelGetter(model, namespace, mockData, workloadResources, [], trafficData);
}

describe('data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockBaseResources);
  });

  it('should be able to create an object', () => {
    const model = { nodes: [], edges: [] };
    const data = baseDataModelGetter(model, namespace, resources, [], []);
    expect(data).toBeTruthy();
  });

  it('should return graph and topology data', () => {
    const model = { nodes: [], edges: [] };
    const data = baseDataModelGetter(model, namespace, resources, [], []);
    expect(data).toEqual(topologyData);
  });

  it('should return graph and topology data only for the deployment kind', () => {
    const totalNodes = mockResources.deployments.data.length;
    const graphData = getTransformedTopologyData(mockResources, ['deployments']);
    expect(graphData.nodes.filter((n) => !n.group)).toHaveLength(totalNodes); // should contain only two deployment
    expect(graphData.nodes.filter((n) => n.group)).toHaveLength(2);
    expect(graphData.edges).toHaveLength(1);
  });

  it('should contain edges information for the deployment kind', () => {
    const graphData = getTransformedTopologyData(mockResources, ['deployments']);
    // check if edges are connected between analytics -> wit
    expect(graphData.edges.length).toEqual(1); // should contain only one edges
    expect(graphData.edges[0].source).toEqual(mockResources.deployments.data[0].metadata.uid); // analytics
    expect(graphData.edges[0].target).toEqual(mockResources.deployments.data[1].metadata.uid); // wit
  });

  it('should return graph and topology data only for the deploymentConfig kind', () => {
    const graphData = getTransformedTopologyData(mockResources, ['deploymentConfigs']);
    expect(graphData.nodes.filter((n) => !n.group)).toHaveLength(
      mockResources.deploymentConfigs.data.length,
    );
    expect(graphData.nodes.filter((n) => n.group)).toHaveLength(0);
    expect(graphData.edges).toHaveLength(0);
  });

  it('should not have group information if the `part-of` label is missing', () => {
    const graphData = getTransformedTopologyData(mockResources, ['deploymentConfigs']);
    expect(graphData.nodes.filter((n) => n.group)).toHaveLength(0);
  });

  xit('should match the previous snapshot', () => {
    expect(
      getTransformedTopologyData(mockResources, ['deployments', 'deploymentConfigs']),
    ).toMatchSnapshot();
  });

  it('should return false for non knative resource', () => {
    mockResources = { ...mockResources, pods: { loaded: true, loadError: '', data: [] } };
    const graphData = getTransformedTopologyData(mockResources, [
      'deploymentConfigs',
      'deployments',
    ]);
    expect((graphData.nodes[0].data.data as WorkloadData).isKnativeResource).toBeFalsy();
  });

  it('should return a valid daemon set', () => {
    const graphData = getTransformedTopologyData(mockResources, ['daemonSets', 'pods']);
    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.nodes[0].data.resources.obj.kind).toEqual('DaemonSet');
  });

  it('should return a valid stateful set', () => {
    const graphData = getTransformedTopologyData(mockResources, ['statefulSets']);
    expect(graphData.nodes).toHaveLength(1);
    expect(graphData.nodes[0].data.resources.obj.kind).toEqual('StatefulSet');
  });

  it('should return a valid standalone pod', () => {
    const graphData = getTransformedTopologyData(mockResources, ['pods']);
    expect(graphData.nodes).toHaveLength(1);
    expect(graphData.nodes[0].data.resources.obj.kind).toEqual('Pod');
  });

  it('should return a valid standalone job', () => {
    const graphData = getTransformedTopologyData(mockResources, ['jobs']);
    expect(graphData.nodes).toHaveLength(1);
    expect(graphData.nodes[0].data.resources.obj.kind).toEqual('Job');
  });

  it('should return a valid cronjobs', () => {
    const graphData = getTransformedTopologyData(mockResources, ['cronJobs']);
    expect(graphData.nodes).toHaveLength(1);
    expect(graphData.nodes[0].data.resources.obj.kind).toEqual('CronJob');
  });

  it('should return a valid che workspace factory URL if cheURL is there', () => {
    const mockCheURL = 'https://mock-che.test-cluster.com';
    const mockGitURL =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-uri'];
    const mockGitBranch =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-ref'];
    const graphData = getTransformedTopologyData(mockResources, ['deploymentConfigs']);
    const generatedEditURL = getEditURL(mockGitURL, mockGitBranch, mockCheURL);
    const { editURL, vcsURI, vcsRef } = graphData.nodes[0].data.data as WorkloadData;
    const editUrl = editURL || getEditURL(vcsURI, vcsRef, mockCheURL);

    expect(editUrl).toBe(generatedEditURL);
  });

  it('should return the git repo URL if cheURL is not there', () => {
    const mockGitURL =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-uri'];
    const mockGitBranch =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-ref'];
    const graphData = getTransformedTopologyData(mockResources, ['deploymentConfigs']);
    const { vcsURI, vcsRef } = graphData.nodes[0].data.data as WorkloadData;
    const editUrl = getEditURL(vcsURI, vcsRef, '');
    expect(editUrl).toBe(`${mockGitURL}/tree/${mockGitBranch}`);
  });

  it('should return only the git repo URL if branch name is not provided', () => {
    const mockGitURL =
      mockResources.deploymentConfigs.data[0].metadata.annotations['app.openshift.io/vcs-uri'];
    const graphData = getTransformedTopologyData(mockResources, ['deploymentConfigs']);
    const { vcsURI } = graphData.nodes[0].data.data as WorkloadData;
    const editUrl = getEditURL(vcsURI, '', '');
    expect(editUrl).toBe(mockGitURL);
  });

  it('should return builder image icon for nodejs', () => {
    const nodejsIcon = getImageForIconClass('icon-nodejs');
    const graphData = getTransformedTopologyData(mockResources, ['deploymentConfigs']);
    expect((graphData.nodes[0].data.data as WorkloadData).builderImage).toBe(nodejsIcon);
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
    const graphData = getTransformedTopologyData(mockResources, ['deployments']);
    expect(graphData.edges).toHaveLength(1);
    expect(graphData.edges[0].type).not.toEqual(TYPE_TRAFFIC_CONNECTOR);
  });

  it('should add a traffic connector when kiali data is passed through trafficData', () => {
    const transformedData = getTransformedTopologyData(
      mockResources,
      WORKLOAD_TYPES,
      MockKialiGraphData,
    );
    expect(transformedData.edges).toHaveLength(2);
    expect(transformedData.edges.filter((e) => e.type === TYPE_TRAFFIC_CONNECTOR)).toHaveLength(1);
  });
});
