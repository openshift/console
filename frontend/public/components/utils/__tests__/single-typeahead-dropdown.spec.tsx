import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { SingleTypeaheadDropdown } from '../single-typeahead-dropdown';
import { act } from 'react-dom/test-utils';
import { Button, Select, SelectOption } from '@patternfly/react-core';

// FIXME Remove this code when jest is updated to at least 25.1.0 -- see https://github.com/jsdom/jsdom/issues/1555
if (!Element.prototype.closest) {
  Element.prototype.closest = function (this: Element, selector: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, consistent-this
    let el: Element | null = this;
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };
}

describe('SingleTypeaheadDropdown', () => {
  let onChange: jest.Mock;

  beforeEach(() => {
    onChange = jest.fn();
  });

  it('should render with placeholder text', () => {
    const wrapper = shallow(
      <SingleTypeaheadDropdown
        items={[{ value: 'test', children: 'test' }]}
        onChange={onChange}
        selectedKey="test"
        placeholder="Select an option"
      />,
    );
    const selectId = wrapper.find(Select).prop('id');
    expect(wrapper.find(`#${selectId}-input`));
    expect(wrapper.find(`[aria-label="Select an option"]`)).toBeTruthy();
  });

  it('should display the clear button when input value is present', () => {
    let wrapper;
    act(() => {
      wrapper = mount(
        <SingleTypeaheadDropdown
          items={[{ value: 'test', children: 'test' }]}
          onChange={onChange}
          selectedKey=""
          hideClearButton={false}
        />,
      );
    });

    act(() => {
      wrapper.find('TextInputGroupMain').simulate('change', { target: { value: 'test' } });
    });

    wrapper.update();
    expect(wrapper.find(Button).exists()).toBeTruthy();
  });

  it('should not display the clear button when hideClearButton is true', () => {
    let wrapper;
    act(() => {
      wrapper = mount(
        <SingleTypeaheadDropdown
          items={[{ value: 'test', children: 'test' }]}
          onChange={onChange}
          selectedKey=""
          hideClearButton={true}
        />,
      );
    });

    act(() => {
      wrapper.find('TextInputGroupMain').simulate('change', { target: { value: 'test' } });
    });

    wrapper.update();
    expect(wrapper.find(Button).exists()).toBeFalsy();
  });

  it('should focus the first item when ArrowDown key is pressed', () => {
    let wrapper;
    act(() => {
      wrapper = mount(
        <SingleTypeaheadDropdown
          items={[
            { value: 'test1', children: 'test1' },
            { value: 'test2', children: 'test2' },
          ]}
          onChange={onChange}
          selectedKey=""
        />,
      );
    });

    act(() => {
      wrapper.find('TextInputGroupMain').simulate('keyDown', { key: 'ArrowDown' });
    });

    wrapper.update();
    expect(wrapper.find(SelectOption).at(0).prop('isFocused')).toBe(true);
  });

  it('should focus the last item when ArrowUp key is pressed on the first item', () => {
    let wrapper;
    act(() => {
      wrapper = mount(
        <SingleTypeaheadDropdown
          items={[
            { value: 'test1', children: 'test1' },
            { value: 'test2', children: 'test2' },
          ]}
          onChange={onChange}
          selectedKey=""
        />,
      );
    });

    act(() => {
      wrapper.find('TextInputGroupMain').simulate('keyDown', { key: 'ArrowUp' });
    });

    wrapper.update();
    expect(wrapper.find(SelectOption).at(1).prop('isFocused')).toBe(true);
  });
});
