import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { InputField } from '@console/shared';
import FlexForm from '../FlexForm';

describe('FlexForm', () => {
  let wrapper: ShallowWrapper<any>;
  beforeEach(() => {
    wrapper = shallow(
      <FlexForm onSubmit={() => {}}>
        <InputField type={TextInputTypes.text} name="test-input" required />
      </FlexForm>,
    );
  });

  it('it should add styles for flex layout', () => {
    expect(wrapper.getElement().props.style).toEqual({
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
    });
  });

  it('it should return original form props', () => {
    expect(wrapper.getElement().props).toHaveProperty('onSubmit');
  });

  it('it should return form component as a wrapper', () => {
    expect(wrapper.is('form')).toEqual(true);
  });

  it('it should contain inputfield as a children of content wrapper', () => {
    const content = wrapper.children().at(0);
    expect(content.is(InputField)).toEqual(true);
  });
});
