import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { Tooltip } from '@patternfly/react-core';
import { TopologyPage, renderTopology } from '../TopologyPage';
import NamespacedPage from '../../NamespacedPage';
import { AsyncComponent, StatusBox } from '@console/internal/components/utils';
import ConnectedTopologyDataController from '../TopologyDataController';
import ProjectListPage from '../../projects/ProjectListPage';
import { topologyData } from './topology-test-data';
import Topology from '../Topology';

type TopologyPageProps = React.ComponentProps<typeof TopologyPage>;
type RenderTopologyProps = React.ComponentProps<typeof renderTopology>;

let topologyProps: TopologyPageProps;
let renderTopologyProps: RenderTopologyProps;

describe('Topology page tests', () => {
  beforeEach(() => {
    topologyProps = {
      activeApplication: 'topology-test',
      knative: false,
      cheURL: 'che.openshift.io',
      serviceBinding: false,
      match: {
        params: {
          name: 'topology-test',
        },
        isExact: true,
        path: '/topology/ns/topology-test/graph',
        url: '',
      },
    };

    renderTopologyProps = {
      data: topologyData,
      loaded: true,
      loadError: '',
      serviceBinding: false,
    };
  });

  it('should render topology list page', () => {
    topologyProps.match.path = '/topology/ns/topology-test/list';
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    expect(wrapper.find(AsyncComponent).exists()).toBe(true);
  });

  it('should render topology graph page', () => {
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    expect(wrapper.find(ConnectedTopologyDataController).exists()).toBe(true);
  });

  it('should render projects list page', () => {
    topologyProps.match.params.name = '';
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    expect(wrapper.find(ProjectListPage).exists()).toBe(true);
  });

  it('should render view shortcuts button on topology page toolbar', () => {
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find('[data-test-id="topology-view-shortcuts"]').exists()).toBe(
      true,
    );
  });

  it('should not render view shortcuts button on topology list page toolbar', () => {
    topologyProps.match.path = '/topology/ns/topology-test/list';
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find('[data-test-id="topology-view-shortcuts"]').exists()).toBe(
      false,
    );
  });

  it('should show the topology icon when on topology list page', () => {
    topologyProps.match.path = '/topology/ns/topology-test/list';
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Tooltip).props().content).toBe('Topology View');
    expect(namespacesPageWrapper.find(Link).props().to).toBe('/topology/ns/topology-test/graph');
  });

  it('should show the topology list icon when on topology page', () => {
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Tooltip).props().content).toBe('List View');
    expect(namespacesPageWrapper.find(Link).props().to).toBe('/topology/ns/topology-test/list');
  });

  it('should render topology when workload is loaded', () => {
    const Component = () => renderTopology(renderTopologyProps);
    const wrapper = shallow(<Component />);
    expect(wrapper.find(StatusBox).exists()).toBe(true);
    expect(wrapper.find(Topology).exists()).toBe(true);
  });

  it('should render all projects list page for graph view when no project is selected', () => {
    topologyProps.match.params.name = '';
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Link).props().to).toBe('/topology/all-namespaces/list');
  });

  it('should render all projects list page for list view when no project is selected', () => {
    topologyProps.match.params.name = '';
    topologyProps.match.path = '/topology/all-namespaces/list';
    const wrapper = shallow(<TopologyPage {...topologyProps} />);
    const namespacesPageWrapper = wrapper.find(NamespacedPage).shallow();
    expect(namespacesPageWrapper.find(Link).props().to).toBe('/topology/all-namespaces/graph');
  });
});
