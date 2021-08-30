import * as React from 'react';
import { shallow } from 'enzyme';
import { FormFooter } from '@console/shared';
import CloudShellSetupForm from '../CloudShellSetupForm';

describe('CloudShellSetupForm', () => {
  it('should disable submit button', () => {
    const wrapper = shallow(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
      />,
    );
    expect(wrapper.find(FormFooter).props().disableSubmit).toBeFalsy();

    wrapper.setProps({ isSubmitting: true });
    expect(wrapper.find(FormFooter).props().disableSubmit).toBeTruthy();

    wrapper.setProps({ isSubmitting: false, errors: { test: 'test' } });
    expect(wrapper.find(FormFooter).props().disableSubmit).toBeTruthy();
  });

  it('should display submit errors', () => {
    const wrapper = shallow(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
        status={{ submitError: 'test' }}
      />,
    );
    expect(wrapper.find(FormFooter).props().errorMessage).toBe('test');
  });
});
