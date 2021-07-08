import * as _ from 'lodash';
import * as k8s from '@console/internal/module/k8s';
import { SERVERLESS_FUNCTION_LABEL } from '../../const';
import { EventSourceCronJobModel, EventSourceKafkaModel } from '../../models';
import {
  MockKnativeResources,
  getEventSourceResponse,
  sampleDeploymentsCamelConnector,
  kafkaConnectionData,
  sinkUriUid,
  eventSourceWithSinkUri,
  sinkUriObj,
  sinkUriData,
} from '../../topology/__tests__/topology-knative-test-data';
import {
  getKnativeServiceData,
  getKnativeTopologyNodeItems,
  getEventTopologyEdgeItems,
  getTrafficTopologyEdgeItems,
  filterRevisionsBaseOnTrafficStatus,
  getParentResource,
  filterRevisionsByActiveApplication,
  createKnativeEventSourceSink,
  getSinkUriTopologyNodeItems,
  getSinkUriTopologyEdgeItems,
  isOperatorBackedKnResource,
  isServerlessFunction,
  getKnSourceKafkaTopologyEdgeItems,
} from '../../topology/knative-topology-utils';
import { EdgeType, NodeType } from '../../topology/topology-types';
import { mockServiceData, mockRevisions } from '../__mocks__/traffic-splitting-utils-mock';
import * as knativefetchutils from '../fetch-dynamic-eventsources-utils';

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
      null,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode).toHaveLength(2);
  });

  it('expect getKnativeTopologyNodeItems to return node data for event sources', () => {
    const knServiceNode = getKnativeTopologyNodeItems(
      getEventSourceResponse(EventSourceCronJobModel).data[0],
      NodeType.EventSource,
      null,
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
  it('expect isOperatorBackedKnResource to return true if resource is backing camel connector source', () => {
    jest
      .spyOn(knativefetchutils, 'getDynamicEventSourcesModelRefs')
      .mockImplementation(() => ['sources.knative.dev~v1alpha1~CamelSource']);
    const isOperatorbacked = isOperatorBackedKnResource(
      sampleDeploymentsCamelConnector.data[0],
      MockKnativeResources,
    );
    expect(isOperatorbacked).toBe(true);
  });
  it('expect isOperatorBackedKnResource to return false if resource is not backing camel connector source', () => {
    jest
      .spyOn(knativefetchutils, 'getDynamicEventSourcesModelRefs')
      .mockImplementation(() => ['sources.knative.dev~v1alpha1~CamelSource']);
    const isOperatorbacked = isOperatorBackedKnResource(
      MockKnativeResources.deployments.data[0],
      MockKnativeResources,
    );
    expect(isOperatorbacked).toBe(false);
  });

  it('expect isServerlessFunction to return false if element is undefined', () => {
    expect(isServerlessFunction(undefined)).toBe(false);
  });

  it('expect isServerlessFunction to return false if a element does not have necessary labels', () => {
    expect(isServerlessFunction(MockKnativeResources.ksservices.data[0])).toBe(false);
  });

  it('expect isServerlessFunction to return results if an element has necessary labels', () => {
    const sampleKnResource: k8s.K8sResourceKind = {
      ...MockKnativeResources.ksservices.data[0],
      metadata: { labels: { [SERVERLESS_FUNCTION_LABEL]: 'true' } },
    };
    expect(isServerlessFunction(sampleKnResource)).toBe(true);
  });
});

describe('Knative Topology Utils', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sUpdate').mockImplementation((model, data) => Promise.resolve({ data }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return rejected promise if source is not provided', () => {
    return expect(
      createKnativeEventSourceSink(undefined, MockKnativeResources.ksservices.data[0]),
    ).rejects.toBeUndefined();
  });

  it('should return rejected promise if target is not provided', () => {
    return expect(
      createKnativeEventSourceSink(
        getEventSourceResponse(EventSourceCronJobModel).data[0],
        undefined,
      ),
    ).rejects.toBeUndefined();
  });

  it('should return rejected promise if source equals target', () => {
    return expect(
      createKnativeEventSourceSink(
        MockKnativeResources.ksservices.data[0],
        MockKnativeResources.ksservices.data[0],
      ),
    ).rejects.toBeUndefined();
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

  it('should sink to the target sinkUri if the target is of type SinkUri', (done) => {
    createKnativeEventSourceSink(
      getEventSourceResponse(EventSourceCronJobModel).data[0],
      sinkUriObj,
    )
      .then(({ data }) => {
        expect(data.spec.sink.uri).toEqual(sinkUriObj.spec?.sinkUri);
        done();
      })
      .catch(() => {
        done();
      });
  });
});

describe('SinkURI knative topology utils', () => {
  it('expect getSinkUriTopologyNodeItems to return node data for sinkUri', () => {
    const knSinkUriNode = getSinkUriTopologyNodeItems(NodeType.SinkUri, sinkUriUid, sinkUriData);
    expect(knSinkUriNode).toBeDefined();
    expect(knSinkUriNode).toHaveLength(1);
  });

  it('expect getSinkUriTopologyEdgeItems to return edge data for eventSource and sinkuri', () => {
    const knEventSrcEdge = getSinkUriTopologyEdgeItems(eventSourceWithSinkUri, sinkUriUid);
    expect(knEventSrcEdge).toBeDefined();
    expect(knEventSrcEdge).toHaveLength(1);
    expect(knEventSrcEdge[0].source).toBe(eventSourceWithSinkUri.metadata?.uid);
    expect(knEventSrcEdge[0].target).toBe(sinkUriUid);
    expect(knEventSrcEdge[0].type).toBe(EdgeType.EventSource);
  });
});

describe('event-source-kafka', () => {
  const kafkaData = getEventSourceResponse(EventSourceKafkaModel).data[0];
  const mockKafkaData = {
    ...kafkaData,
    spec: {
      ...kafkaData.spec,
      bootstrapServers: ['my-first-x--xxx-xx-icyjelhe---wyj---xi.kafka.devshift.org:443'],
      consumerGroup: 'foobar',
      net: {
        sasl: {
          enable: true,
          password: {
            secretKeyRef: {
              key: 'client-secret',
              name: 'rh-cloud-services-service-account',
            },
          },
          type: {},
          user: {
            secretKeyRef: {
              key: 'client-id',
              name: 'rh-cloud-services-service-account',
            },
          },
        },
        tls: {
          caCert: {},
          cert: {},
          enable: true,
          key: {},
        },
      },
    },
  };
  it('shoud return correct edges', () => {
    const expectedEdges = [
      {
        id: '1317f615-9636-11e9-b134-06a61d886b689_1_85ffdf52-59f5-4120-b2cd-e90c991845e0',
        type: 'event-source-kafka-link',
        source: '1317f615-9636-11e9-b134-06a61d886b689_1',
        target: '85ffdf52-59f5-4120-b2cd-e90c991845e0',
      },
    ];
    const edges = getKnSourceKafkaTopologyEdgeItems(mockKafkaData, kafkaConnectionData);
    expect(edges).toEqual(expectedEdges);
  });

  it('should not return any edges', () => {
    const kafkaConnection = {
      ...kafkaConnectionData,
      data: [
        {
          ...kafkaConnectionData.data[0],
          status: {
            bootstrapServerHost: null,
          },
        },
      ],
    };
    const edges = getKnSourceKafkaTopologyEdgeItems(mockKafkaData, kafkaConnection);
    expect(edges).toEqual([]);
  });

  it('should not return any edges if KafkaConnection is not present', () => {
    const edges = getKnSourceKafkaTopologyEdgeItems(mockKafkaData, undefined);
    expect(edges).toEqual([]);
  });
});
