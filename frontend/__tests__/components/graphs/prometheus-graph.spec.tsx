import { Provider } from 'react-redux';
import { Link, BrowserRouter } from 'react-router-dom-v5-compat';
import { mount, shallow } from 'enzyme';

import { FLAGS } from '@console/shared';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { setFlag } from '@console/internal/actions/flags';
import * as UIActions from '@console/internal/actions/ui';
import {
  PrometheusGraph,
  PrometheusGraphLink,
} from '@console/internal/components/graphs/prometheus-graph';
import store from '@console/internal/redux';
import { Title } from '@patternfly/react-core';

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(),
}));

const useActivePerspectiveMock = useActivePerspective as jest.Mock;

describe('<PrometheusGraph />', () => {
  it('should render a title', () => {
    const wrapper = shallow(<PrometheusGraph title="Test" />);
    expect(
      wrapper.contains(
        <Title headingLevel="h5" className="graph-title">
          Test
        </Title>,
      ),
    ).toBe(true);
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
            <BrowserRouter>
              <Provider store={store}>{children}</Provider>
            </BrowserRouter>
          ),
        },
      );
      expect(wrapper.find('p.test-class').exists()).toBe(true);
      return wrapper;
    };

    let wrapper;

    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    store.dispatch(UIActions.setActiveNamespace('default'));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/dev-monitoring/ns/default/metrics?query0=test');

    useActivePerspectiveMock.mockClear();
    useActivePerspectiveMock.mockReturnValue(['admin', () => {}]);
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/dev-monitoring/ns/default/metrics?query0=test');

    store.dispatch(setFlag(FLAGS.CAN_GET_NS, true));
    useActivePerspectiveMock.mockClear();
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/dev-monitoring/ns/default/metrics?query0=test');

    useActivePerspectiveMock.mockClear();
    useActivePerspectiveMock.mockReturnValue(['admin', () => {}]);
    wrapper = getWrapper('');
    expect(wrapper.find(Link).exists()).toBe(false);
    wrapper = getWrapper('test');
    expect(wrapper.find(Link).exists()).toBe(true);
    expect(wrapper.find(Link).props().to).toEqual('/monitoring/query-browser?query0=test');
  });
});
