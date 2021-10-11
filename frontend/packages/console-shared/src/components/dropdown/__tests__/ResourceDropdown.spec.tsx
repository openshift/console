import * as React from 'react';
import { shallow, mount, ShallowWrapper } from 'enzyme';
import { mockDropdownData } from '../__mocks__/dropdown-data-mock';
import ResourceDropdown, { ResourceDropdownProps } from '../ResourceDropdown';

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => {
  return {
    useUserSettingsCompatibility: () => ['', () => {}],
  };
});

const componentFactory = (props = {}) => (
  <ResourceDropdown
    placeholder="Select an Item"
    actionItems={[
      {
        actionTitle: 'Create New Application',
        actionKey: '#CREATE_APPLICATION_KEY#',
      },
    ]}
    selectedKey={null}
    dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
    autoSelect
    loaded
    {...props}
  />
);

describe('ResourceDropdown test suite', () => {
  it('should select nothing as default option when no items and action item are available', () => {
    const spy = jest.fn();
    const wrapper = shallow(componentFactory({ onChange: spy, actionItems: null }));
    wrapper.setProps({ resources: [] });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should select Create New Application as default option when only one action item is available', () => {
    const spy = jest.fn();
    const wrapper = shallow(componentFactory({ onChange: spy }));
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should select Create New Application as default option when more than one action items is available', () => {
    const spy = jest.fn();
    const wrapper = shallow(
      componentFactory({
        onChange: spy,
        actionItems: [
          {
            actionTitle: 'Create New Application',
            actionKey: '#CREATE_APPLICATION_KEY#',
          },
          {
            actionTitle: 'Choose Existing Application',
            actionKey: '#CHOOSE_APPLICATION_KEY#',
          },
        ],
      }),
    );
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should select Choose Existing Application as default option when selectedKey is passed as #CHOOSE_APPLICATION_KEY#', () => {
    const spy = jest.fn();
    const wrapper = shallow(
      componentFactory({
        onChange: spy,
        actionItems: [
          {
            actionTitle: 'Create New Application',
            actionKey: '#CREATE_APPLICATION_KEY#',
          },
          {
            actionTitle: 'Choose Existing Application',
            actionKey: '#CHOOSE_APPLICATION_KEY#',
          },
        ],
      }),
    );
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: [], selectedKey: '#CHOOSE_APPLICATION_KEY#' });
    expect(component.state('title')).toEqual('Choose Existing Application');
    expect(spy).toHaveBeenCalledWith('#CHOOSE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should select first item as default option when an item is available', () => {
    const spy = jest.fn();
    const wrapper = shallow(componentFactory({ onChange: spy }));
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: mockDropdownData.slice(0, 1) });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-1', 'app-group-1', mockDropdownData[0].data[0]);
    }, 0);
  });

  it('should select first item as default option when more than one items are available', () => {
    const spy = jest.fn();
    const wrapper = shallow(componentFactory({ onChange: spy }));
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: mockDropdownData });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-1', 'app-group-1', mockDropdownData[0].data[0]);
    }, 0);
  });

  it('should select given selectedKey as default option when more than one items are available', () => {
    const spy = jest.fn();
    const wrapper = shallow(componentFactory({ onChange: spy, selectedKey: 'app-group-1' }));
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: mockDropdownData, selectedKey: 'app-group-2' });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-2', 'app-group-2', mockDropdownData[0].data[1]);
    }, 0);
  });

  it('should reset to default item when the selectedKey is no longer available in the items', () => {
    const spy = jest.fn();
    const wrapper = shallow(
      componentFactory({
        onChange: spy,
        selectedKey: 'app-group-1',
        actionItem: null,
        allSelectorItem: {
          allSelectorKey: '#ALL_APPS#',
          allSelectorTitle: 'all applications',
        },
      }),
    );
    const component: ShallowWrapper<ResourceDropdownProps> = wrapper.dive();
    component.setProps({ resources: mockDropdownData, selectedKey: 'app-group-2' });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-2', 'app-group-2', mockDropdownData[0].data[1]);
    }, 0);
    component.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#ALL_APPS#', undefined, undefined);
  });

  it('should callback selected item from dropdown and change the title to selected item', () => {
    const spy = jest.fn();
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const wrapper = mount(
      componentFactory({ onChange: spy, selectedKey: 'app-group-1', id: 'dropdown1' }),
    );
    wrapper.setProps({ resources: mockDropdownData, selectedKey: 'app-group-2' });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-2', 'app-group-2', mockDropdownData[0].data[1]);
    }, 0);

    const dropdownBtn = wrapper.find('button#dropdown1');
    dropdownBtn.simulate('click', { preventDefault });

    const dropdownRows = wrapper.find('DropDownRowWithTranslation');
    const dropdownItem = dropdownRows.last().find('#app-group-3-link');
    dropdownItem.simulate('click', { preventDefault, stopPropagation });

    expect(wrapper.find('button').text()).toEqual('app-group-3');
  });

  it('should pass a third argument in the onChange handler based on the resources availability', () => {
    const spy = jest.fn();
    const wrapper = mount(componentFactory({ onChange: spy }));

    wrapper.setProps({ resources: mockDropdownData.slice(0, 1) });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-1', 'app-group-1', mockDropdownData[0].data[0]);
    }, 0);

    wrapper.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should show error if loadError', () => {
    const spy = jest.fn();
    const wrapper = mount(componentFactory({ onChange: spy }));
    mockDropdownData[0].data = [];
    mockDropdownData[0].loadError = 'Error in loading';
    wrapper.setProps({ resources: mockDropdownData, loadError: 'Error in loading' });
    expect(wrapper.find('button').text()).toEqual('Error loading - Select an Item');
  });
});
