import * as React from 'react';
import { shallow } from 'enzyme';
import { Chart, ChartArea, ChartAxis } from '@patternfly/react-charts';

import { AreaChart } from '@console/internal/components/graphs/area';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';

import {
  PrometheusGraph,
  PrometheusGraphLink,
} from '@console/internal/components/graphs/prometheus-graph';

const MOCK_DATA = [[{ x: 1, y: 100 }]];

describe('<AreaChart />', () => {
  it('should render an area chart', () => {
    const wrapper = shallow(<AreaChart title="Test Area" data={MOCK_DATA} />);
    const prometheusGraph = wrapper.find(PrometheusGraph);
    expect(prometheusGraph.exists()).toBe(true);
    expect(prometheusGraph.props().title).toBe('Test Area');
    expect(wrapper.find(PrometheusGraphLink).exists()).toBe(true);
    expect(wrapper.find(Chart).exists()).toBe(true);
    expect(wrapper.find(ChartAxis).exists()).toBe(true);
    expect(wrapper.find(ChartArea).exists()).toBe(true);
    expect(wrapper.find(GraphEmpty).exists()).toBe(false);
  });

  it('should not render any axes', () => {
    const wrapper = shallow(
      <AreaChart title="Test Area" data={MOCK_DATA} xAxis={false} yAxis={false} />,
    );
    expect(wrapper.find(ChartAxis).exists()).toBe(false);
  });

  it('should show an empty state', () => {
    const wrapper = shallow(<AreaChart data={[]} />);
    expect(wrapper.find(PrometheusGraphLink).exists()).toBe(true);
    expect(wrapper.find(GraphEmpty).exists()).toBe(true);
  });
});
