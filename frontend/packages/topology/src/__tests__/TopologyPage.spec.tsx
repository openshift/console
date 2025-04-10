import { shallow } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import NamespacedPage from '@console/dev-console/src/components/NamespacedPage';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { useQueryParams, useUserSettingsCompatibility } from '@console/shared/src';
import { TopologyPage } from '../components/page/TopologyPage';
import { TopologyViewType } from '../topology-types';
import { usePreferredTopologyView } from '../user-preferences/usePreferredTopologyView';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    useContext: () => jest.fn(),
  };
});

jest.mock('react-redux', () => {
  const ActualReactRedux = jest.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

let mockViewParam = '';

jest.mock('@console/shared', () => {
  const ActualShared = jest.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: jest.fn(),
    useUserSettingsCompatibility: jest.fn(),
  };
});

jest.mock('../user-preferences/usePreferredTopologyView', () => ({
  usePreferredTopologyView: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('Topology page tests', () => {
  beforeEach(() => {
    mockViewParam = '';
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      projects: { data: [], loaded: true, loadError: '' },
    });
    (useQueryParams as jest.Mock).mockReturnValue(new Map().set('view', mockViewParam));
  });

  it('should render topology page', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(<TopologyPage hideProjects={false} />);
    expect(wrapper.find(NamespacedPage).exists()).toBe(true);
  });

  it('should default to graph view', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(<TopologyPage hideProjects={false} />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should allow setting default to list view', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(
      <TopologyPage hideProjects={false} defaultViewType={TopologyViewType.list} />,
    );
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });

  it('should render view from URL view path and ignore userSettings if it is available', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['list', true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default', view: 'graph' });
    (useQueryParams as jest.Mock).mockReturnValue(new Map().set('view', 'graph'));
    const wrapper = shallow(<TopologyPage hideProjects={false} />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should render view using the preferred view from user settings if it exists and does not have value "latest", and all user settings have loaded', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['graph', true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(<TopologyPage hideProjects={false} activeViewStorageKey="fake-key" />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should render view using the last viewed from user settings if it exists and preferred view has value "latest", and all user settings have loaded', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['graph', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['latest', true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(<TopologyPage hideProjects={false} activeViewStorageKey="fake-key" />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should render view using the last viewed from user settings if it exists and preferred view does not exist", and all user settings have loaded', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue([undefined, true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(<TopologyPage hideProjects={false} activeViewStorageKey="fake-key" />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });

  it('should render view using the default view if preferred and last view from user settings does not exist", and all user settings have loaded', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue([undefined, () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue([undefined, true]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(
      <TopologyPage hideProjects={false} defaultViewType={TopologyViewType.list} />,
    );
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });

  it('should continue to support URL view path for graph', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (useQueryParams as jest.Mock).mockReturnValue(new Map().set('view', 'graph'));
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default', view: 'graph' });
    const wrapper = shallow(<TopologyPage hideProjects={false} />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should continue to support URL view path for list', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new Map().set('view', 'list'));
    jest.spyOn(Router, 'useParams').mockReturnValue({ name: 'default' });
    const wrapper = shallow(<TopologyPage hideProjects={false} />);
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });
});
