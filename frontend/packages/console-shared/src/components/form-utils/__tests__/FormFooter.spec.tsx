import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FormFooter } from '@console/shared';
import { Button } from '@patternfly/react-core';

type FormFooterProps = React.ComponentProps<typeof FormFooter>;
describe('FormFooter', () => {
  let wrapper: ShallowWrapper<any>;
  let props: FormFooterProps;
  const className = 'ocs-form-footer';
  beforeEach(() => {
    props = {
      errorMessage: 'error',
      submitLabel: 'Create',
      resetLabel: 'Reset',
      cancelLabel: 'Cancel',
      handleReset: jest.fn(),
      handleCancel: jest.fn(),
      sticky: false,
      disableSubmit: false,
      isSubmitting: false,
    };
    wrapper = shallow(<FormFooter {...props} />);
  });

  it('should contain submit, reset and cancel button', () => {
    const submitButton = wrapper.find('[data-test-id="submit-button"]');
    const resetButton = wrapper.find('[data-test-id="reset-button"]');
    expect(wrapper.find(Button)).toHaveLength(3);
    expect(submitButton.exists()).toBe(true);
    expect(resetButton.exists()).toBe(true);
  });

  it('should contain right lables in the submit and reset button', () => {
    expect(wrapper.find('[data-test-id="submit-button"]').props().children).toBe('Create');
    expect(wrapper.find('[data-test-id="reset-button"]').props().children).toBe('Reset');
    expect(wrapper.find('[data-test-id="cancel-button"]').props().children).toBe('Cancel');
  });

  it('should be able to configure data-test-id and labels', () => {
    wrapper.setProps({
      submitLabel: 'submit-lbl',
      resetLabel: 'reset-lbl',
      cancelLabel: 'cancel-lbl',
    });
    expect(wrapper.find('[type="submit"]').props().children).toBe('submit-lbl');
    expect(wrapper.find('[data-test-id="reset-button"]').props().children).toBe('reset-lbl');
    expect(wrapper.find('[data-test-id="cancel-button"]').props().children).toBe('cancel-lbl');
  });

  it('should be able to make the action buttons sticky', () => {
    wrapper.setProps({
      sticky: true,
    });
    expect(wrapper.at(0).props().className).toBe(`${className} ${className}__sticky`);
  });

  it('should have submit button when handle submit is not passed', () => {
    expect(wrapper.find('[data-test-id="submit-button"]').props().type).toBe('submit');
  });

  it('should not have submit button when handle submit callback is passed', () => {
    const additionalProps = { handleSubmit: jest.fn() };
    wrapper.setProps(additionalProps);
    expect(wrapper.find('[data-test-id="submit-button"]').props().type).not.toBe('submit');
  });

  it('should call the handler when a button is clicked', () => {
    const additionalProps = { handleSubmit: jest.fn() };
    wrapper.setProps(additionalProps);
    wrapper.find('[data-test-id="submit-button"]').simulate('click');
    expect(additionalProps.handleSubmit).toHaveBeenCalled();

    wrapper.find('[data-test-id="reset-button"]').simulate('click');
    expect(props.handleReset).toHaveBeenCalled();

    wrapper.find('[data-test-id="cancel-button"]').simulate('click');
    expect(props.handleCancel).toHaveBeenCalled();
  });
});
