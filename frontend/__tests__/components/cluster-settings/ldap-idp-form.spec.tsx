import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ListInput } from '../../../public/components/utils';
import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import {
  AddLDAPPage,
  AddLDAPPageState,
} from '../../../public/components/cluster-settings/ldap-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    withTranslation: () => (Component) => {
      Component.defaultProps = { ...Component.defaultProps, t: (s) => s };
      return Component;
    },
  };
});

const i18nNS = 'ldap-idp-form';

describe('Add Identity Provider: LDAP', () => {
  let wrapper: ShallowWrapper<{}, AddLDAPPageState>;

  beforeEach(() => {
    wrapper = shallow(<AddLDAPPage />);
  });

  it('should render AddLDAPPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct LDAP IDP page title', () => {
    expect(wrapper.contains(`${i18nNS}~Add Identity Provider: LDAP`)).toBeTruthy();
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
    controlButtonTest(wrapper, 'public');
  });

  it('should prefill ldap in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual(wrapper.state().name);
  });

  it('should prefill ldap attribute list input default values', () => {
    expect(
      wrapper
        .find(ListInput)
        .at(0)
        .props().initialValues,
    ).toEqual(['dn']);
    expect(
      wrapper
        .find(ListInput)
        .at(1)
        .props().initialValues,
    ).toEqual(['uid']);
    expect(
      wrapper
        .find(ListInput)
        .at(2)
        .props().initialValues,
    ).toEqual(['cn']);
    expect(
      wrapper
        .find(ListInput)
        .at(3)
        .props().initialValues,
    ).toEqual(undefined);
  });
});
