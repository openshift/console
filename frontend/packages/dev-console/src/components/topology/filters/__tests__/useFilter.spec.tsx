import * as React from 'react';
import { mount } from 'enzyme';
import { K8sResourceKind } from '@console/internal/module/k8s';
import useFilter from '../useFilter';
import { sampleDeploymentConfigs } from '../../__tests__/topology-test-data';
import { TopologyFilters } from '../filter-utils';

describe('useFilter', () => {
  let filters: TopologyFilters;
  const resource = sampleDeploymentConfigs.data[0];
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
  const Comp = (props: { filters: TopologyFilters; resource: K8sResourceKind }) => {
    const filtered = useFilter(props.filters, props.resource);
    return <div data-filtered={filtered} />;
  };

  it('Should match the deployment config with a given searchquery', () => {
    filters.searchQuery = 'nodejs';
    const wrapper = mount(<Comp filters={filters} resource={resource} />);
    expect(wrapper.find('div').prop('data-filtered')).toBe(true);
  });

  it('Should perform fuzzy search with the given searchQuery', () => {
    filters.searchQuery = 'ode';
    const wrapper = mount(<Comp filters={filters} resource={resource} />);
    expect(wrapper.find('div').prop('data-filtered')).toBe(true);
  });

  it('Should perform Case Insensitive fuzzy search with the given searchQuery', () => {
    filters.searchQuery = 'NODEJS';
    const wrapper = mount(<Comp filters={filters} resource={resource} />);
    expect(wrapper.find('div').prop('data-filtered')).toBe(true);
  });

  it('Should not match the deployment config with a given searchquery', () => {
    filters.searchQuery = 'php';
    const wrapper = mount(<Comp filters={filters} resource={resource} />);
    expect(wrapper.find('div').prop('data-filtered')).toBe(false);
  });
  it('Should not match if given searchquery is empty', () => {
    filters.searchQuery = '';
    const wrapper = mount(<Comp filters={filters} resource={resource} />);
    expect(wrapper.find('div').prop('data-filtered')).toBe(false);
  });
});
