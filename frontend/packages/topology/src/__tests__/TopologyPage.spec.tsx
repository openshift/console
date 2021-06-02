import * as React from 'react';
import { shallow } from 'enzyme';
import NamespacedPage from '@console/dev-console/src/components/NamespacedPage';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { useUserSettingsCompatibility } from '@console/shared/src';
import TopologyPage from '../components/page/TopologyPage';
import { TopologyViewType } from '../topology-types';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('react', () => {
  const ActualReact = require.requireActual('react');
  return {
    ...ActualReact,
    useContext: () => jest.fn(),
  };
});

jest.mock('react-redux', () => {
  const ActualReactRedux = require.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

let mockViewParam = '';

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map().set('view', mockViewParam),
    useUserSettingsCompatibility: jest.fn(),
  };
});

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const match = { params: { name: 'default' }, isExact: true, path: '', url: '' };

describe('Topology page tests', () => {
  beforeEach(() => {
    mockViewParam = '';
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      projects: { data: [], loaded: true, loadError: '' },
    });
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
  });

  it('should render topology page', () => {
    const wrapperWithFallback = shallow(<TopologyPage match={match} hideProjects={false} />);
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find(NamespacedPage).exists()).toBe(true);
  });

  it('should default to graph view', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    const wrapperWithFallback = shallow(<TopologyPage match={match} hideProjects={false} />);
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should allow setting default to list view', () => {
    const wrapperWithFallback = shallow(
      <TopologyPage match={match} hideProjects={false} defaultViewType={TopologyViewType.list} />,
    );
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });

  it('should render graph if useUserSettingsCompatibility setting returns that', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['graph', () => {}, true]);
    const wrapperWithFallback = shallow(
      <TopologyPage match={match} hideProjects={false} activeViewStorageKey="fake-key" />,
    );
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should render list if useUserSettingsCompatibility setting returns that', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    const wrapperWithFallback = shallow(
      <TopologyPage match={match} hideProjects={false} activeViewStorageKey="fake-key" />,
    );
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });

  it('should continue to support URL view path for graph', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    const viewMatch = {
      params: { name: 'default' },
      isExact: true,
      path: '/topology/graph',
      url: '',
    };
    const wrapperWithFallback = shallow(<TopologyPage match={viewMatch} hideProjects={false} />);
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(false);
  });

  it('should continue to support URL view path for list', () => {
    const viewMatch = {
      params: { name: 'default' },
      isExact: true,
      path: '/topology/list',
      url: '',
    };
    const wrapperWithFallback = shallow(<TopologyPage match={viewMatch} hideProjects={false} />);
    const wrapper = wrapperWithFallback.find('TopologyPage').shallow();
    expect(wrapper.find('[data-test-id="topology-list-page"]').exists()).toBe(true);
  });
});
