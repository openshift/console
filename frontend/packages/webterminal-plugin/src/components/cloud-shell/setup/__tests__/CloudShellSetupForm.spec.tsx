import * as React from 'react';
import { shallow } from 'enzyme';
import { FormFooter } from '@console/shared';
import AdminNamespaceSection from '../AdminNamespaceSection';
import CloudShellSetupForm from '../CloudShellSetupForm';
import NamespaceSection from '../NamespaceSection';

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

  it('should display AdminNamespaceSection for admins and not display NamespaceSection', () => {
    const wrapper = shallow(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
        isAdmin
      />,
    );
    expect(wrapper.find(NamespaceSection).exists()).toBe(false);
    expect(wrapper.find(AdminNamespaceSection).exists()).toBe(true);
  });

  it('should display NamespaceSection for non admins and not display AdminNamespaceSection', () => {
    const wrapper = shallow(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
      />,
    );
    expect(wrapper.find(AdminNamespaceSection).exists()).toBe(false);
    expect(wrapper.find(NamespaceSection).exists()).toBe(true);
  });
});
