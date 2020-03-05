import * as React from 'react';
import { Provider } from 'react-redux';
import { Link, Router } from 'react-router-dom';
import { mount, shallow } from 'enzyme';

import { FLAGS } from '@console/shared/src/constants/common';
import { setFlag } from '@console/internal/actions/features';
import * as UIActions from '@console/internal/actions/ui';
import { history } from '@console/internal/components/utils/router';
import {
  PrometheusGraph,
  PrometheusGraphLink,
  getPrometheusExpressionBrowserURL,
} from '@console/internal/components/graphs/prometheus-graph';
import store from '@console/internal/redux';

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
  it('should only render with a link if query is set', () => {
    window.SERVER_FLAGS.prometheusBaseURL = 'prometheusBaseURL';

    // Need full mount with redux store since this is a redux-connected component
    const getWrapper = (query: string) => {
      const wrapper = mount(
        <PrometheusGraphLink query={query}>
          <p className="test-class" />
        </PrometheusGraphLink>,
        {
          wrappingComponent: ({ children }) => (
            <Router history={history}>
              <Provider store={store}>{children}</Provider>
            </Router>
          ),
        },
      );
      expect(wrapper.find('p.test-class').exists()).toBe(true);
      return wrapper;
    };

    let wrapper;

    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    store.dispatch(UIActions.setActivePerspective('dev'));
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/dev-monitoring/ns/default/metrics?query0=test');

    store.dispatch(UIActions.setActivePerspective('admin'));
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/dev-monitoring/ns/default/metrics?query0=test');

    store.dispatch(setFlag(FLAGS.CAN_GET_NS, true));
    store.dispatch(UIActions.setActivePerspective('dev'));
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/dev-monitoring/ns/default/metrics?query0=test');

    store.dispatch(UIActions.setActivePerspective('admin'));
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/monitoring/query-browser?query0=test');
  });
});

describe('getPrometheusExpressionBrowserURL()', () => {
  const url = getPrometheusExpressionBrowserURL('https://mock.prometheus.url', [
    'test-query-1',
    'test-query-2',
  ]);
  expect(url).toBe(
    'https://mock.prometheus.url/graph?g0.range_input=1h&g0.expr=test-query-1&g0.tab=0&g1.range_input=1h&g1.expr=test-query-2&g1.tab=0',
  );
});
