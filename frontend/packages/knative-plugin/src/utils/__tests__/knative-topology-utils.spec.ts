import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import {
  getKnativeServiceData,
  getKnativeTopologyNodeItems,
  getEventTopologyEdgeItems,
  getTrafficTopologyEdgeItems,
  NodeType,
  filterRevisionsBaseOnTrafficStatus,
} from '../knative-topology-utils';
import { mockServiceData, mockRevisions } from '../__mocks__/traffic-splitting-utils-mock';

describe('knative topology utils', () => {
  it('expect getKnativeServiceData to return knative resources', () => {
    const knResource = getKnativeServiceData(
      MockKnativeResources.ksservices.data[0],
      MockKnativeResources,
    );
    expect(knResource.ksroutes).toBeDefined();
    expect(knResource.ksroutes).toHaveLength(1);
    expect(knResource.configurations).toBeDefined();
    expect(knResource.configurations).toHaveLength(1);
    expect(knResource.revisions).toBeDefined();
    expect(knResource.revisions).toHaveLength(1);
  });

  it('expect getKnativeTopologyNodeItems to return node data for service', () => {
    const knServiceNode = getKnativeTopologyNodeItems(
      MockKnativeResources.ksservices.data[0],
      NodeType.KnService,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode).toHaveLength(2);
  });

  it('expect getKnativeTopologyNodeItems to return node data for event sources', () => {
    const knServiceNode = getKnativeTopologyNodeItems(
      MockKnativeResources.eventSourceCronjob.data[0],
      NodeType.EventSource,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode[0].id).toBe('1317f615-9636-11e9-b134-06a61d886b689');
    expect(knServiceNode[0].type).toBe(NodeType.EventSource);
  });

  it('expect getEventTopologyEdgeItems to return edge data for event sources', () => {
    const knEventEdge = getEventTopologyEdgeItems(
      MockKnativeResources.eventSourceCronjob.data[0],
      MockKnativeResources.ksservices,
    );
    expect(knEventEdge).toBeDefined();
    expect(knEventEdge).toHaveLength(1);
    expect(knEventEdge[0].source).toBe('1317f615-9636-11e9-b134-06a61d886b689');
    expect(knEventEdge[0].target).toBe('cea9496b-8ce0-11e9-bb7b-0ebb55b110b8');
    expect(knEventEdge[0].type).toBe('event-source-link');
  });

  it('expect getTrafficTopologyEdgeItems to return edge data for knative revisions with traffic split info', () => {
    const knRevisionsEdge = getTrafficTopologyEdgeItems(
      MockKnativeResources.ksservices.data[0],
      MockKnativeResources.revisions,
    );
    expect(knRevisionsEdge).toBeDefined();
    expect(knRevisionsEdge).toHaveLength(1);
    expect(knRevisionsEdge[0].source).toBe('cea9496b-8ce0-11e9-bb7b-0ebb55b110b8');
    expect(knRevisionsEdge[0].target).toBe('02c34a0e-9638-11e9-b134-06a61d886b62');
    expect(knRevisionsEdge[0].type).toBe('revision-traffic');
  });

  it('should only return revisions which are in the service traffic status', () => {
    expect(filterRevisionsBaseOnTrafficStatus(mockServiceData, mockRevisions)).toHaveLength(1);
    const mockRev = {
      apiVersion: '',
      kind: 'Revision',
      metadata: { name: 'rev-4', namespace: '' },
    };
    const mockTraffic = { revisionName: 'rev-4', percent: 0, tag: 'foo', latestRevision: false };
    mockServiceData.status.traffic.push(mockTraffic);
    mockRevisions.push(mockRev);
    expect(filterRevisionsBaseOnTrafficStatus(mockServiceData, mockRevisions)).toHaveLength(2);
  });

  it('should return undefined if revisions or traffic status is not defined', () => {
    const mockService = { metadata: { name: 'ser', namepspace: '' }, status: {}, spec: {} };
    expect(filterRevisionsBaseOnTrafficStatus(mockService, mockRevisions)).toBeUndefined();
    expect(filterRevisionsBaseOnTrafficStatus(mockServiceData, undefined)).toBeUndefined();
  });
});
