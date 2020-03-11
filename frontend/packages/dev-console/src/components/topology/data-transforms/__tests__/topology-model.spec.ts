import * as _ from 'lodash';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import {
  topologyDataModel,
  dataModel,
  MockResources,
  sampleHelmResourcesMap,
} from '../../__tests__/topology-test-data';
import { topologyModelFromDataModel } from '../topology-model';
import { transformTopologyData } from '../data-transformer';
import { TopologyFilters } from '../../filters/filter-utils';
import { allowedResources } from '../../topology-utils';

describe('topology model ', () => {
  let filters: TopologyFilters;

  beforeEach(() => {
    filters = {
      display: {
        podCount: true,
        eventSources: true,
        knativeServices: true,
        appGrouping: true,
        operatorGrouping: true,
        helmGrouping: true,
      },
      searchQuery: '',
    };
  });

  it('should return topology model data', () => {
    const newModel = topologyModelFromDataModel(topologyDataModel);
    expect(newModel).toEqual(dataModel);
  });

  it('should have the correct nodes, groups, and edges when no filters', () => {
    const topologyTransformedData = transformTopologyData(
      _.cloneDeep(MockResources),
      allowedResources,
      undefined,
      undefined,
      sampleHelmResourcesMap,
    );
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    expect(newModel.nodes.filter((n) => !n.group).length).toBe(6);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(3);
    expect(newModel.edges.length).toBe(1);
  });

  it('should hide nodes not in the filtered application', () => {
    const topologyTransformedData = transformTopologyData(
      _.cloneDeep(MockResources),
      allowedResources,
      undefined,
      undefined,
      sampleHelmResourcesMap,
    );
    const newModel = topologyModelFromDataModel(topologyTransformedData, 'application-1', filters);
    expect(newModel.nodes.filter((n) => !n.group).length).toBe(6);
    expect(newModel.nodes.filter((n) => !n.group && n.visible).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group).length).toBe(3);
    expect(newModel.nodes.filter((n) => n.group && n.visible).length).toBe(1);
  });

  it('should flag application groups as collapsed when display filter is set', () => {
    const topologyTransformedData = transformTopologyData(
      _.cloneDeep(MockResources),
      allowedResources,
      undefined,
      undefined,
      sampleHelmResourcesMap,
    );
    filters.display.appGrouping = false;
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(3);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(2);
  });

  it('should flag operator groups as collapsed when display filter is set', () => {
    const topologyTransformedData = transformTopologyData(
      _.cloneDeep(MockResources),
      allowedResources,
      undefined,
      undefined,
      sampleHelmResourcesMap,
    );
    filters.display.operatorGrouping = false;
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(3);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(1);
  });
});
