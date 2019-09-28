import * as React from 'react';
import { shallow } from 'enzyme';
import { ChartDonutThreshold, ChartDonutUtilization } from '@patternfly/react-charts';

import { GaugeChart } from '@console/internal/components/graphs/gauge';
import {
  PrometheusGraph,
  PrometheusGraphLink,
} from '@console/internal/components/graphs/prometheus-graph';

const MOCK_DATA = { x: 'test', y: 100 };

describe('<GaugeChart />', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(<GaugeChart title="Test Gauge" label="Test" data={MOCK_DATA} />);
  });

  it('should render a gauge chart', () => {
    const prometheusGraph = wrapper.find(PrometheusGraph);
    expect(prometheusGraph.exists()).toBe(true);
    expect(prometheusGraph.props().title).toBe('Test Gauge');
    expect(wrapper.find(PrometheusGraphLink).exists()).toBe(true);
    expect(wrapper.find(ChartDonutThreshold).exists()).toBe(true);
    expect(wrapper.find(ChartDonutUtilization).exists()).toBe(true);
  });

  it('should show an error state', () => {
    wrapper.setProps({ error: 'Error Message' });
    expect(wrapper.find(ChartDonutUtilization).props().title).toBe('Error Message');
  });

  it('should show a loading state', () => {
    wrapper.setProps({ loading: true });
    expect(wrapper.find(ChartDonutUtilization).props().title).toBe('Loading');
  });
});
