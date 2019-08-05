import * as React from 'react';
import { mount, shallow } from 'enzyme';

import { PrometheusGraph, PrometheusGraphLink, getPrometheusExpressionBrowserURL } from '@console/internal/components/graphs/prometheus-graph';
import store from '@console/internal/redux';
import { Provider } from 'react-redux';

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
    wrapper.setProps({className: 'test-class'});
    expect(wrapper.find('div.test-class').exists()).toBe(true);

  });
});

describe('<PrometheusGraphLink />', () => {
  it('should render an anchor element', () => {
    // Need full mount with redux store since this is a redux-connected compoenent
    const wrapper = mount(<Provider store={store}><PrometheusGraphLink query="test"><p className="test-class"></p></PrometheusGraphLink></Provider>);
    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('p.test-class').exists()).toBe(true);
  });

  it('should not render an anchor element', () => {
    // Need full mount with redux store since this is a redux-connected compoenent
    const wrapper = mount(<Provider store={store}><PrometheusGraphLink query=""><p className="test-class"></p></PrometheusGraphLink></Provider>);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('p.test-class').exists()).toBe(true);
  });
});

describe('getPrometheusExpressionBrowserURL()', () => {
  const urls = {
    'prometheus-k8s': 'https://mock.prometheus.url',
  };
  const url = getPrometheusExpressionBrowserURL(urls, ['test-query-1', 'test-query-2']);
  expect(url).toBe('https://mock.prometheus.url/graph?g0.range_input=1h&g0.expr=test-query-1&g0.tab=0&g1.range_input=1h&g1.expr=test-query-2&g1.tab=0');
});
