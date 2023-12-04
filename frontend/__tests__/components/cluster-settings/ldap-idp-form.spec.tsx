import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux';

import { ListInput } from '../../../public/components/utils';
import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import { AddLDAPPage } from '../../../public/components/cluster-settings/ldap-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

describe('Add Identity Provider: LDAP', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <BrowserRouter>
          <AddLDAPPage />
        </BrowserRouter>
      </Provider>,
    );
  });

  it('should render AddLDAPPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct LDAP IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: LDAP')).toBeTruthy();
  });

  it('should render the form elements of AddLDAPPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find('input[id="url"]').exists()).toBe(true);
    expect(wrapper.find('input[id="bind-dn"]').exists()).toBe(true);
    expect(wrapper.find('input[id="bind-password"]').exists()).toBe(true);
    expect(wrapper.find(ListInput).length).toEqual(4);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill ldap in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual('ldap');
  });

  it('should prefill ldap attribute list input default values', () => {
    expect(wrapper.find(ListInput).at(0).props().initialValues).toEqual(['dn']);
    expect(wrapper.find(ListInput).at(1).props().initialValues).toEqual(['uid']);
    expect(wrapper.find(ListInput).at(2).props().initialValues).toEqual(['cn']);
    expect(wrapper.find(ListInput).at(3).props().initialValues).toEqual(undefined);
  });
});
