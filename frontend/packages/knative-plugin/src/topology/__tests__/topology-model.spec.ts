import * as _ from 'lodash';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import { TopologyFilters } from '@console/dev-console/src/components/topology/filters/filter-utils';
import {
  transformTopologyData,
  topologyModelFromDataModel,
} from '@console/dev-console/src/components/topology';
import { TYPE_EVENT_SOURCE } from '../const';
import { MockKnativeResources } from './topology-knative-test-data';

describe('topology model ', () => {
  let filters: TopologyFilters;

  beforeEach(() => {
    filters = {
      display: {
        podCount: true,
        eventSources: true,
        virtualMachines: true,
        showLabels: true,
        knativeServices: true,
        appGrouping: true,
        operatorGrouping: true,
        helmGrouping: true,
      },
      searchQuery: '',
    };
  });

  it('should flag knative groups as collapsed when display filter is set', () => {
    const topologyTransformedData = transformTopologyData(_.cloneDeep(MockKnativeResources), [
      'deployments',
      'deploymentConfigs',
    ]);
    filters.display.knativeServices = false;
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    expect(newModel.nodes.filter((n) => n.group).length).toBe(2);
    expect(newModel.nodes.filter((n) => n.group && n.collapsed).length).toBe(1);
  });

  it('should not render event sources if corresponding filter returns false', () => {
    filters.display.eventSources = false;
    const topologyTransformedData = transformTopologyData(_.cloneDeep(MockKnativeResources), [
      'deployments',
      'deploymentConfigs',
    ]);
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    const eventSources = newModel.nodes.filter((n) => n.type === TYPE_EVENT_SOURCE);
    const visibleEventSources = eventSources.filter((n) => n.visible);
    expect(eventSources.length).toBe(5);
    expect(visibleEventSources.length).toBe(0);
  });

  it('should render event sources if corresponding filter returns true', () => {
    const topologyTransformedData = transformTopologyData(_.cloneDeep(MockKnativeResources), [
      'deployments',
      'deploymentConfigs',
    ]);
    const newModel = topologyModelFromDataModel(
      topologyTransformedData,
      ALL_APPLICATIONS_KEY,
      filters,
    );
    const eventSources = newModel.nodes.filter((n) => n.type === TYPE_EVENT_SOURCE);
    const visibleEventSources = eventSources.filter((n) => n.visible);
    expect(eventSources.length).toBe(5);
    expect(visibleEventSources.length).toBe(5);
  });
});
