import * as React from 'react';
import { shallow } from 'enzyme';
import ResourceDropdown from '../ResourceDropdown';
import { mockDropdownData } from '../__mocks__/dropdown-data-mock';

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
    const component = shallow(componentFactory({ onChange: spy, actionItems: null }));
    component.setProps({ resources: [] });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should select Create New Application as default option when only one action item is available', () => {
    const spy = jest.fn();
    const component = shallow(componentFactory({ onChange: spy }));
    component.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should select Create New Application as default option when more than one action items is available', () => {
    const spy = jest.fn();
    const component = shallow(
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
    component.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should select Choose Existing Application as default option when selectedKey is passed as #CHOOSE_APPLICATION_KEY#', () => {
    const spy = jest.fn();
    const component = shallow(
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
    component.setProps({ resources: [], selectedKey: '#CHOOSE_APPLICATION_KEY#' });
    expect(component.state('title')).toEqual('Choose Existing Application');
    expect(spy).toHaveBeenCalledWith('#CHOOSE_APPLICATION_KEY#', undefined, undefined);
  });

  it('should select first item as default option when an item is available', () => {
    const spy = jest.fn();
    const component = shallow(componentFactory({ onChange: spy }));
    component.setProps({ resources: mockDropdownData.slice(0, 1) });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-1', 'app-group-1', mockDropdownData[0].data[0]);
    }, 0);
  });

  it('should select first item as default option when more than one items are available', () => {
    const spy = jest.fn();
    const component = shallow(componentFactory({ onChange: spy }));
    component.setProps({ resources: mockDropdownData });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-1', 'app-group-1', mockDropdownData[0].data[0]);
    }, 0);
  });

  it('should select given selectedKey as default option when more than one items are available', () => {
    const spy = jest.fn();
    const component = shallow(componentFactory({ onChange: spy, selectedKey: 'app-group-1' }));
    component.setProps({ resources: mockDropdownData, selectedKey: 'app-group-2' });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-2', 'app-group-2', mockDropdownData[0].data[1]);
    }, 0);
  });

  it('should reset to default item when the selectedKey is no longer available in the items', () => {
    const spy = jest.fn();
    const component = shallow(
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
    const component = shallow(
      componentFactory({ onChange: spy, selectedKey: 'app-group-1', id: 'dropdown1' }),
    );
    component.setProps({ resources: mockDropdownData, selectedKey: 'app-group-2' });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-2', 'app-group-2', mockDropdownData[0].data[1]);
    }, 0);

    const dropdownComponent = component.find('Dropdown#dropdown1').shallow();
    const dropdownBtn = dropdownComponent.find('button#dropdown1');
    dropdownBtn.simulate('click', { preventDefault });

    const dropdownItem = dropdownComponent
      .find('DropDownRow')
      .last()
      .shallow()
      .find('#app-group-3-link');
    dropdownItem.simulate('click', { preventDefault, stopPropagation });
    expect(component.state('title')).toEqual('app-group-3');
  });

  it('should pass a third argument in the onChange handler based on the resources availability', () => {
    const spy = jest.fn();
    const component = shallow(componentFactory({ onChange: spy }));

    component.setProps({ resources: mockDropdownData.slice(0, 1) });
    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('app-group-1', 'app-group-1', mockDropdownData[0].data[0]);
    }, 0);

    component.setProps({ resources: [] });
    expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
  });
});
