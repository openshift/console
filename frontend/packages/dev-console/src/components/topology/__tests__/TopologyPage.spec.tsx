import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { Tooltip } from '@patternfly/react-core';
import { renderTopology, TopologyPageContext } from '../TopologyPage';
import NamespacedPage from '../../NamespacedPage';
import { StatusBox } from '@console/internal/components/utils';
import ConnectedTopologyDataController from '../TopologyDataController';
import CreateProjectListPage from '../../projects/CreateProjectListPage';
import { topologyData } from './topology-test-data';
import { ConnectedTopologyView } from '../TopologyView';

type TopologyPageProps = React.ComponentProps<typeof TopologyPageContext>;

let topologyProps: TopologyPageProps;

jest.mock('react-redux', () => {
  const ActualReactRedux = require.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map(),
  };
});

describe('Topology page tests', () => {
  beforeEach(() => {
    spyOn(React, 'useContext').and.returnValue({ isEmptyModel: false });
    topologyProps = {
      match: {
        params: {
          name: 'topology-test',
        },
        isExact: true,
        path: '/topology/ns/topology-test/graph',
        url: '',
      },
    };
  });

  it('should render topology page', () => {
    topologyProps.match.path = '/topology/ns/topology-test/list';
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    expect(wrapper.find(NamespacedPage).exists()).toBe(true);
  });

  it('should render topology graph page', () => {
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    expect(wrapper.find(ConnectedTopologyDataController).exists()).toBe(true);
  });

  it('should render projects list page', () => {
    topologyProps.match.params.name = '';
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    expect(wrapper.find(CreateProjectListPage).exists()).toBe(true);
  });

  it('should render view shortcuts button on topology page toolbar', () => {
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find('[data-test-id="topology-view-shortcuts"]').exists()).toBe(
      true,
    );
  });

  it('should not render view shortcuts button on topology list page toolbar', () => {
    topologyProps.match.path = '/topology/ns/topology-test/list';
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find('[data-test-id="topology-view-shortcuts"]').exists()).toBe(
      false,
    );
  });

  it('should show the topology icon when on topology list page', () => {
    topologyProps.match.path = '/topology/ns/topology-test/list';
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Tooltip).props().content).toBe('Topology View');
    expect(namespacesPageWrapper.find(Link).props().to).toContain(
      '/topology/ns/topology-test/graph',
    );
  });

  it('should show the topology list icon when on topology page', () => {
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Tooltip).props().content).toBe('List View');
    expect(namespacesPageWrapper.find(Link).props().to).toContain(
      '/topology/ns/topology-test/list',
    );
  });

  it('should render topology when workload is loaded', () => {
    const Component = () =>
      renderTopology({
        model: topologyData,
        showGraphView: true,
        loaded: true,
        loadError: '',
        namespace: 'topology-test',
      });
    const wrapper = shallow(<Component />);
    expect(wrapper.find(StatusBox).exists()).toBe(true);
    expect(wrapper.find(ConnectedTopologyView).exists()).toBe(true);
  });

  it('should not contain view switcher when when no project is selected', () => {
    topologyProps.match.params.name = '';
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Link).exists()).toBe(false);
  });
});

describe('Topology page tests', () => {
  beforeEach(() => {
    spyOn(React, 'useContext').and.returnValue({ isEmptyModel: true });
    topologyProps = {
      match: {
        params: {
          name: 'topology-test',
        },
        isExact: true,
        path: '/topology/ns/topology-test/graph',
        url: '',
      },
    };
  });

  it('should not contain view switcher when no model', () => {
    const wrapper = shallow(<TopologyPageContext {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Link).exists()).toBe(false);
  });
});
