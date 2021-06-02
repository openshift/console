import { Model, NodeModel, EdgeModel } from '@patternfly/react-topology';
import * as _ from 'lodash';
import * as utils from '@console/internal/components/utils';
import * as k8s from '@console/internal/module/k8s';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { MockBaseResources } from '@console/shared/src/utils/__tests__/test-resource-data';
import { TEST_KINDS_MAP } from '@console/topology/src/__tests__/topology-test-data';
import { baseDataModelGetter } from '@console/topology/src/data-transforms/data-transformer';
import { getWorkloadResources } from '@console/topology/src/data-transforms/transform-utils';
import { updateModelFromFilters } from '@console/topology/src/data-transforms/updateModelFromFilters';
import {
  DEFAULT_TOPOLOGY_FILTERS,
  EXPAND_GROUPS_FILTER_ID,
  SHOW_GROUPS_FILTER_ID,
  getFilterById,
} from '@console/topology/src/filters';
import {
  OdcNodeModel,
  TopologyDataModelDepicted,
  TopologyDataResources,
  WorkloadData,
} from '@console/topology/src/topology-types';
import { cleanUpWorkload, WORKLOAD_TYPES } from '@console/topology/src/utils';
import { ServiceModel, EventingBrokerModel } from '../../models';
import * as knativefetchutils from '../../utils/fetch-dynamic-eventsources-utils';
import {
  TYPE_EVENT_PUB_SUB,
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
} from '../const';
import { getKnativeTopologyDataModel } from '../data-transformer';
import { isKnativeResource } from '../isKnativeResource';
import {
  applyKnativeDisplayOptions,
  EXPAND_KNATIVE_SERVICES_FILTER_ID,
  getTopologyFilters,
} from '../knativeFilters';
import {
  MockKnativeResources,
  sampleDeploymentsCamelConnector,
} from './topology-knative-test-data';
import Spy = jasmine.Spy;

const spyAndReturn = (spy: Spy) => (returnValue: any) =>
  new Promise((resolve) =>
    spy.and.callFake((...args) => {
      resolve(args);
      return returnValue;
    }),
  );

const getTransformedTopologyData = (
  mockData: TopologyDataResources,
  dataModelDepicters: TopologyDataModelDepicted[] = [],
) => {
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, WORKLOAD_TYPES);
  return getKnativeTopologyDataModel('test-project', mockData).then((model) => {
    return baseDataModelGetter(
      model,
      'test-project',
      mockData,
      workloadResources,
      dataModelDepicters,
    );
  });
};

const getNodeById = (id: string, graphData: Model): NodeModel => {
  return graphData.nodes.find((n) => n.id === id);
};

const getNodesByType = (type: string, graphData: Model): NodeModel[] => {
  return graphData.nodes.filter((n) => n.type === type);
};

const getEdgesByType = (type: string, graphData: Model): EdgeModel[] => {
  return graphData.edges.filter((n) => n.type === type);
};

const filterers = [applyKnativeDisplayOptions];

describe('knative data transformer ', () => {
  let mockResources: TopologyDataResources;

  beforeEach(() => {
    mockResources = _.cloneDeep(MockKnativeResources);
  });

  it('should return true for knative resource', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    expect((graphData.nodes[0].data.data as WorkloadData).isKnativeResource).toBeTruthy();
  });

  it('should return revision resources for knative workloads', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    const revRes = getNodeById('cea9496b-8ce0-11e9-bb7b-0ebb55b110b8', graphData).data.resources
      .revisions;
    expect(revRes.length).toEqual(1);
  });

  it('should return Configuration resources for knative workloads', async () => {
    const graphData = await getTransformedTopologyData(mockResources);
    const configRes = getNodeById('cea9496b-8ce0-11e9-bb7b-0ebb55b110b8', graphData).data.resources
      .configurations;
    expect(configRes).toHaveLength(1);
  });

  it('should filter out deployments created for knative resources and event sources', async () => {
    mockResources.deployments.data = [
      ...mockResources.deployments.data,
      ...MockBaseResources.deployments.data,
    ];
    const workloadResources = getWorkloadResources(mockResources, TEST_KINDS_MAP, WORKLOAD_TYPES);
    const graphData = await getTransformedTopologyData(mockResources);
    const filteredResources = workloadResources.filter((resource) =>
      isKnativeResource(resource, graphData),
    );
    expect(workloadResources).toHaveLength(5);
    expect(filteredResources).toHaveLength(2);
  });

  it('should filter out deployments created for camelConnector sources', async () => {
    jest
      .spyOn(knativefetchutils, 'getDynamicEventSourcesModelRefs')
      .mockImplementation(() => ['sources.knative.dev~v1alpha1~CamelSource']);
    mockResources.deployments.data = [
      ...mockResources.deployments.data,
      ...MockBaseResources.deployments.data,
      ...sampleDeploymentsCamelConnector.data,
    ];
    const workloadResources = getWorkloadResources(mockResources, TEST_KINDS_MAP, WORKLOAD_TYPES);
    const graphData = await getTransformedTopologyData(mockResources);
    const filteredResources = workloadResources.filter((resource) =>
      isKnativeResource(resource, graphData),
    );
    expect(workloadResources).toHaveLength(6);
    expect(filteredResources).toHaveLength(3);
  });

  it('Should delete all the specific models related to knative deployments if the build config is not present i.e. for resource created through deploy image form', async (done) => {
    const graphData = await getTransformedTopologyData(mockResources);
    const node = graphData.nodes.find(
      (n) => (n as OdcNodeModel).resource.metadata.name === 'overlayimage',
    ) as OdcNodeModel;

    const spy = spyOn(k8s, 'k8sKill');
    const checkAccessSpy = spyOn(utils, 'checkAccess');
    const spyK8sList = spyOn(k8s, 'k8sList');
    spyAndReturn(spy)(Promise.resolve({}));
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: true } }));
    spyAndReturn(spyK8sList)(Promise.resolve([]));

    cleanUpWorkload(node.resource, true)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(2);
        expect(removedModels.find((rm) => rm.id === ServiceModel.id)).toBeTruthy();
        done();
      })
      .catch((err) => fail(err));
  });

  it('should flag knative services as collapsed when display filter is set', async () => {
    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_KNATIVE_SERVICES_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(1);
  });

  it('should flag knative services as collapsed when all groups are collapsed', async () => {
    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(EXPAND_KNATIVE_SERVICES_FILTER_ID, filters).value = true;
    getFilterById(EXPAND_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(2);
    expect(
      newModel.nodes.filter((n) => n.type === TYPE_KNATIVE_SERVICE && n.collapsed).length,
    ).toBe(1);
  });

  it('should flag not show knative services when show groups is false', async () => {
    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    const graphData = await getTransformedTopologyData(mockResources);
    getFilterById(SHOW_GROUPS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(graphData, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.type === TYPE_KNATIVE_SERVICE).length).toBe(0);
    expect(newModel.nodes.filter((n) => n.type === TYPE_KNATIVE_REVISION).length).toBe(1);
  });

  it('should return eventpub nodes and link for event brokers', async () => {
    mockResources.deployments.data = [
      ...mockResources.deployments.data,
      ...MockBaseResources.deployments.data,
    ];
    const graphData = await getTransformedTopologyData(mockResources, [isKnativeResource]);
    const eventPubSubNodes = getNodesByType(TYPE_EVENT_PUB_SUB, graphData);
    const eventPubSubLinks = getEdgesByType(TYPE_EVENT_PUB_SUB_LINK, graphData);
    expect(eventPubSubNodes).toHaveLength(1);
    expect(eventPubSubLinks).toHaveLength(1);
  });

  it('should contain the broker resources in broker kind node', async () => {
    mockResources.deployments.data = [
      ...mockResources.deployments.data,
      ...MockBaseResources.deployments.data,
    ];
    const graphData = await getTransformedTopologyData(mockResources, [isKnativeResource]);
    const eventPubSubNodes = getNodesByType(TYPE_EVENT_PUB_SUB, graphData);
    const [brokerNode] = eventPubSubNodes.filter(
      (node) => node?.data?.data.kind === k8s.referenceForModel(EventingBrokerModel),
    );
    expect(brokerNode.data.resources.deployments).toHaveLength(1);
    expect(brokerNode.data.resources.ksservices).toHaveLength(1);
    expect(brokerNode.data.resources.triggers).toHaveLength(1);
  });
});
