import * as _ from 'lodash';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  MockBaseResources,
  sampleDeployments,
} from '@console/shared/src/utils/__tests__/test-resource-data';
import {
  resources,
  topologyData,
  MockKialiGraphData,
  TEST_KINDS_MAP,
} from '../../__tests__/topology-test-data';
import { TYPE_TRAFFIC_CONNECTOR } from '../../const';
import { WorkloadData, TopologyDataResources, TrafficData } from '../../topology-types';
import { getEditURL, WORKLOAD_TYPES } from '../../utils/topology-utils';
import { getTrafficConnectors, baseDataModelGetter } from '../data-transformer';
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

  it('should match the previous snapshot', () => {
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
    const vcsURI = 'https://github.com/openshift/console';
    const vcsRef = 'testing';
    const generatedEditURL = getEditURL(vcsURI, vcsRef, mockCheURL);
    expect(generatedEditURL).toBe(
      `${mockCheURL}/f?url=${vcsURI}/tree/${vcsRef}&policies.create=peruser`,
    );
  });

  it('should return the git repo URL if cheURL is not there', () => {
    const vcsURI = 'https://github.com/openshift/console';
    const vcsRef = 'testing';
    const editUrl = getEditURL(vcsURI, vcsRef, '');
    expect(editUrl).toBe(`${vcsURI}/tree/${vcsRef}`);
  });

  it('should return only the git repo URL if branch name is not provided', () => {
    const vcsURI = 'https://github.com/openshift/console';
    const editUrl = getEditURL(vcsURI, '', '');
    expect(editUrl).toBe(vcsURI);
  });

  it('should return transformed HTTP URL if the git repo URL is an SSH URL', () => {
    const mockGitURI = 'git@github.com:openshift/console';
    const editUrl = getEditURL(mockGitURI, '', '');
    expect(editUrl).toBe('https://github.com/openshift/console');
  });

  it('should return full git url for GitHub URI', () => {
    const mockGitURI = 'https://github.com/openshift/console';
    const editUrl = getEditURL(mockGitURI, 'branch1');
    expect(editUrl).toBe('https://github.com/openshift/console/tree/branch1');
  });

  it('should return full git url for GitLab URI', () => {
    const mockGitURI = 'https://gitlab.com/example/reponame';
    const editUrl = getEditURL(mockGitURI, 'branch1');
    expect(editUrl).toBe('https://gitlab.com/example/reponame/-/tree/branch1');
  });

  it('should return full git url for Bitbucket URI', () => {
    const mockGitURI = 'https://bitbucket.org/username/examplerepo';
    const editUrl = getEditURL(mockGitURI, 'branch1');
    expect(editUrl).toBe('https://bitbucket.org/username/examplerepo/src/branch1');
  });

  it('should return only git url for repo from non-supported git provider', () => {
    const mockGitURI = 'https://example.com/username/examplerepo';
    const editUrl = getEditURL(mockGitURI, 'branch1');
    expect(editUrl).toBe('https://example.com/username/examplerepo');
  });

  it('should return full git url for supported providers with custom domains', () => {
    let editUrl = getEditURL('https://github.example.com/uname/repo', 'branch1');
    expect(editUrl).toBe('https://github.example.com/uname/repo/tree/branch1');
    editUrl = getEditURL('https://gitlab.example.com/uname/repo', 'branch1');
    expect(editUrl).toBe('https://gitlab.example.com/uname/repo/-/tree/branch1');
    editUrl = getEditURL('https://bitbucket.example.com/uname/repo', 'branch1');
    expect(editUrl).toBe('https://bitbucket.example.com/uname/repo/src/branch1');
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
