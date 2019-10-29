import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import {
  getKnativeServiceData,
  getKnativeTopologyNodeItem,
  getEventTopologyEdgeItems,
  getTrafficTopologyEdgeItems,
  filterKnativeBasedOnActiveApplication,
  getTopologyServiceGroupItems,
  nodeType,
} from '../knative-topology-utils';

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

  it('expect getKnativeTopologyNodeItem to return node data for service', () => {
    const knServiceNode = getKnativeTopologyNodeItem(
      MockKnativeResources.ksservices.data[0],
      nodeType.KnService,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode).toHaveProperty('children');
    expect(knServiceNode.id).toBe('cea9496b-8ce0-11e9-bb7b-0ebb55b110b8');
    expect(knServiceNode.type).toBe(nodeType.KnService);
  });

  it('expect getKnativeTopologyNodeItem to return node data for revision', () => {
    const knServiceNode = getKnativeTopologyNodeItem(
      MockKnativeResources.revisions.data[0],
      nodeType.Revision,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode.id).toBe('02c34a0e-9638-11e9-b134-06a61d886b62');
    expect(knServiceNode.type).toBe(nodeType.Revision);
  });

  it('expect getKnativeTopologyNodeItem to return node data for event sources', () => {
    const knServiceNode = getKnativeTopologyNodeItem(
      MockKnativeResources.eventSourceCronjob.data[0],
      nodeType.EventSource,
      MockKnativeResources,
    );
    expect(knServiceNode).toBeDefined();
    expect(knServiceNode.id).toBe('1317f615-9636-11e9-b134-06a61d886b689');
    expect(knServiceNode.type).toBe(nodeType.EventSource);
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
    expect(knEventEdge[0].type).toBe('connects-to-src');
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
    expect(knRevisionsEdge[0].type).toBe('connects-to-traffic');
  });

  it('expect filterKnativeBasedOnActiveApplication to return resources based on active application', () => {
    const activeApplications = filterKnativeBasedOnActiveApplication(
      MockKnativeResources.ksservices.data,
      'myapp',
    );
    expect(activeApplications).toBeDefined();
    expect(activeApplications).toHaveLength(1);
  });

  it('expect filterKnativeBasedOnActiveApplication to return resources based on active application', () => {
    const activeApplications = filterKnativeBasedOnActiveApplication(
      MockKnativeResources.revisions.data,
      'myapp',
    );
    expect(activeApplications).toBeDefined();
    expect(activeApplications).toHaveLength(0);
  });

  it('expect getTopologyServiceGroupItems to form group data based on labels', () => {
    const groupData = getTopologyServiceGroupItems(MockKnativeResources.ksservices.data[0], []);
    expect(groupData).toBeDefined();
    expect(groupData).toHaveLength(1);
  });
});
