import * as _ from 'lodash';
import * as k8s from '@console/internal/module/k8s';
import {
  MockKnativeResources,
  getEventSourceResponse,
} from '../../topology/__tests__/topology-knative-test-data';
import {
  getKnativeServiceData,
  getKnativeTopologyNodeItems,
  getEventTopologyEdgeItems,
  getTrafficTopologyEdgeItems,
  NodeType,
  filterRevisionsBaseOnTrafficStatus,
  getParentResource,
  filterRevisionsByActiveApplication,
  createKnativeEventSourceSink,
} from '../../topology/knative-topology-utils';
import { mockServiceData, mockRevisions } from '../__mocks__/traffic-splitting-utils-mock';
import { EventSourceCronJobModel } from '../../models';

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
  it('expect getParentResource to return parent resources', () => {
    const configuration = getParentResource(
      MockKnativeResources.revisions.data[0],
      MockKnativeResources.configurations.data,
    );
    const revision = getParentResource(configuration, MockKnativeResources.services.data);
    expect(configuration).toBeDefined();
    expect(configuration.metadata.uid).toBe('1317f615-9636-11e9-b134-06a61d886b62');
    expect(revision).toBeDefined();
    expect(revision.metadata.uid).toBe('cea9496b-8ce0-11e9-bb7b-0ebb55b110b8');
  });
  it('expect getParentResource not to throw error if resource is not defined', () => {
    const configuration = getParentResource(undefined, MockKnativeResources.configurations.data);
    const revision = getParentResource(undefined, MockKnativeResources.services.data);
    expect(configuration).not.toBeDefined();
    expect(revision).not.toBeDefined();
  });
  it('expect filterRevisionsByActiveApplication not to throw error if the service does not have traffic block', () => {
    const mockResources = _.cloneDeep(MockKnativeResources);
    mockResources.ksservices.data[0] = _.omit(MockKnativeResources.ksservices.data[0], 'status');
    const revisions = filterRevisionsByActiveApplication(
      mockResources.revisions.data,
      mockResources,
      'myapp',
    );
    expect(revisions).toBeDefined();
    expect(revisions).toHaveLength(0);
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
      getEventSourceResponse(EventSourceCronJobModel).data[0],
      NodeType.EventSource,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode[0].id).toBe('1317f615-9636-11e9-b134-06a61d886b689_1');
    expect(knServiceNode[0].type).toBe(NodeType.EventSource);
  });

  it('expect getEventTopologyEdgeItems to return edge data for event sources', () => {
    const knEventEdge = getEventTopologyEdgeItems(
      getEventSourceResponse(EventSourceCronJobModel).data[0],
      MockKnativeResources.ksservices,
    );
    expect(knEventEdge).toBeDefined();
    expect(knEventEdge).toHaveLength(1);
    expect(knEventEdge[0].source).toBe('1317f615-9636-11e9-b134-06a61d886b689_1');
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

  it('expect getTrafficTopologyEdgeItems to return the sum of the percentage if there are multiple same revisions', () => {
    const ksvc = _.cloneDeep(MockKnativeResources.ksservices.data[0]);
    const { uid, name: revisionName } = MockKnativeResources.revisions.data[0].metadata;
    ksvc.status = {
      traffic: [
        { uid, revisionName, percent: 40 },
        { uid, revisionName, percent: 60 },
      ],
    };
    const knRevisionsEdge = getTrafficTopologyEdgeItems(ksvc, MockKnativeResources.revisions);
    expect(knRevisionsEdge).toBeDefined();
    expect(knRevisionsEdge).toHaveLength(1);
    expect(knRevisionsEdge[0].data.percent).toBe(100);
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

  it('should return undefined if traffic status is not defined', () => {
    const mockService = { metadata: { name: 'ser', namepspace: '' }, status: {}, spec: {} };
    expect(filterRevisionsBaseOnTrafficStatus(mockService, mockRevisions)).toBeUndefined();
  });
});

describe('Knative Topology Utils', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sUpdate').mockImplementation((model, data) => Promise.resolve({ data }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should move sink to the target knServcice', (done) => {
    createKnativeEventSourceSink(
      getEventSourceResponse(EventSourceCronJobModel).data[0],
      MockKnativeResources.ksservices.data[0],
    )
      .then(({ data }) => {
        expect(data.spec.sink.ref.name).toEqual('overlayimage');
        expect(data.spec.sink.ref.kind).toEqual('service');
        done();
      })
      .catch(() => {
        done();
      });
  });
});
