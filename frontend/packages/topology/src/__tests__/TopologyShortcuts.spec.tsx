import { mount, shallow } from 'enzyme';
import { Shortcut } from '@console/shared';
import { getTopologyShortcuts } from '../components/graph-view/TopologyShortcuts';
import { TopologyViewType } from '../topology-types';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('TopologyShortcuts tests', () => {
  it('should show reduced list in view shortcuts popover on topology toolbar when there are no workloads', () => {
    const wrapper = mount(
      getTopologyShortcuts(jest.fn(), {
        supportedFileTypes: undefined,
        isEmptyModel: true,
        viewType: TopologyViewType.graph,
        allImportAccess: true,
      }),
    );

    expect(wrapper.find(Shortcut).exists()).toBe(true);
    expect(wrapper.find('[data-test-id="open-quick-search"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="ctrl-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="Spacebar-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="create-connector-handle"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="hover"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="context-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="right-click"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="view-details"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="click"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="edit-application-grouping"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('should show dragNdrop action in the view shortcuts popover on topology toolbar only when supportedFileTypes is not empty', () => {
    const wrapper = mount(
      getTopologyShortcuts(jest.fn(), {
        supportedFileTypes: ['jar'],
        isEmptyModel: true,
        viewType: TopologyViewType.graph,
        allImportAccess: true,
      }),
    );

    expect(wrapper.find(Shortcut).exists()).toBe(true);
    expect(wrapper.find('[data-test-id="upload-file"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="drag-and-drop"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('should show reduced list in the view shortcuts popover on topology toolbar for list view', () => {
    const wrapper = shallow(
      getTopologyShortcuts(jest.fn(), {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.list,
        allImportAccess: true,
      }),
    );

    expect(wrapper.find('[data-test-id="upload-file"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="view-details"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="open-quick-search"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="create-connector-handle"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="context-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="edit-application-grouping"]').exists()).toBe(false);
  });
  it('should show the full list in the view shortcuts popover on topology toolbar for graph view', () => {
    const wrapper = shallow(
      getTopologyShortcuts(jest.fn(), {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.graph,
        allImportAccess: true,
      }),
    );
    expect(wrapper.find('[data-test-id="move"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="upload-file"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="context-menu"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="create-connector-handle"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="view-details"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="open-quick-search"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="edit-application-grouping"]').exists()).toBe(true);
  });
  it('should show only view details and quick search actions in list view', () => {
    const wrapper = shallow(
      getTopologyShortcuts(jest.fn(), {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.list,
        allImportAccess: false,
      }),
    );
    expect(wrapper.find('[data-test-id="move"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="view-details"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="open-quick-search"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="create-connector-handle"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="context-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="edit-application-grouping"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="upload-file"]').exists()).toBe(false);
  });

  it('should show only view details and quick search actions in graph view', () => {
    const wrapper = shallow(
      getTopologyShortcuts(jest.fn(), {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.graph,
        allImportAccess: false,
      }),
    );
    expect(wrapper.find('[data-test-id="move"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="view-details"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="open-quick-search"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="create-connector-handle"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="context-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="edit-application-grouping"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-id="upload-file"]').exists()).toBe(false);
  });
});
