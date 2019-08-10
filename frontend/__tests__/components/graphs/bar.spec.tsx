import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { ChartBar } from '@patternfly/react-charts';

import { BarChart } from '@console/internal/components/graphs/bar';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingBox } from '@console/internal/components/utils';
import { PrometheusGraph, PrometheusGraphLink } from '@console/internal/components/graphs/prometheus-graph';

const MOCK_DATA = [{ x: 1, y: 100 }];

describe('<BarChart />', () => {
  it('should render a bar chart', () => {
    const wrapper = shallow(<BarChart title="Test Bar" data={MOCK_DATA} />);
    const prometheusGraph = wrapper.find(PrometheusGraph);
    expect(prometheusGraph.exists()).toBe(true);
    expect(prometheusGraph.props().title).toBe('Test Bar');
    expect(wrapper.find(PrometheusGraphLink).exists()).toBe(true);
    expect(wrapper.find(ChartBar).exists()).toBe(true);
    expect(wrapper.find(GraphEmpty).exists()).toBe(false);
  });

  it('should show an empty state', () => {
    const wrapper = shallow(<BarChart data={[]} />);
    expect(wrapper.find(GraphEmpty).exists()).toBe(true);
  });

  it('should show a loading state', () => {
    const wrapper = mount(<BarChart data={[]} loading={true} />); // Use full mount function so that we can check for a LoadingBox child
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });
});
