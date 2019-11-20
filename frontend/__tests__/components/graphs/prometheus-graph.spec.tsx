import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';

import {
  PrometheusGraph,
  PrometheusGraphLink,
  getPrometheusExpressionBrowserURL,
} from '@console/internal/components/graphs/prometheus-graph';

describe('<PrometheusGraph />', () => {
  it('should render a title', () => {
    const wrapper = shallow(<PrometheusGraph title="Test" />);
    expect(wrapper.contains(<h5 className="graph-title">Test</h5>)).toBe(true);
  });

  it('should not render a title', () => {
    const wrapper = shallow(<PrometheusGraph />);
    expect(wrapper.find('h5').exists()).toBe(false);
  });

  it('should forward class names to wrapping div', () => {
    const wrapper = shallow(<PrometheusGraph />);
    expect(wrapper.find('div.graph-wrapper').exists()).toBe(true);
    expect(wrapper.find('div.test-class').exists()).toBe(false);
    wrapper.setProps({ className: 'test-class' });
    expect(wrapper.find('div.test-class').exists()).toBe(true);
  });
});

describe('<PrometheusGraphLink />', () => {
  it('should render with a link', () => {
    const wrapper = shallow(
      <PrometheusGraphLink query="test">
        <p className="test-class" />
      </PrometheusGraphLink>,
    );
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find('p.test-class').exists()).toBe(true);
  });

  it('should not render with a link', () => {
    const wrapper = shallow(
      <PrometheusGraphLink query="">
        <p className="test-class" />
      </PrometheusGraphLink>,
    );
    expect(wrapper.find(Link).exists()).toBe(false);
    expect(wrapper.find('p.test-class').exists()).toBe(true);
  });
});

describe('getPrometheusExpressionBrowserURL()', () => {
  const urls = {
    'prometheus-k8s': 'https://mock.prometheus.url',
  };
  const url = getPrometheusExpressionBrowserURL(urls, ['test-query-1', 'test-query-2']);
  expect(url).toBe(
    'https://mock.prometheus.url/graph?g0.range_input=1h&g0.expr=test-query-1&g0.tab=0&g1.range_input=1h&g1.expr=test-query-2&g1.tab=0',
  );
});
