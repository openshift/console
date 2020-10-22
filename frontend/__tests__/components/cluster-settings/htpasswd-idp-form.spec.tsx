import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import {
  AddHTPasswdPage,
  AddHTPasswdPageState,
  DroppableFileInput as HTDroppableInput,
} from '../../../public/components/cluster-settings/htpasswd-idp-form';
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

const i18nNS = 'htpasswd-idp-form';

describe('Add Identity Provider: HTPasswd', () => {
  let wrapper: ShallowWrapper<{}, AddHTPasswdPageState>;

  beforeEach(() => {
    wrapper = shallow(<AddHTPasswdPage />);
  });

  it('should render AddHTPasswdPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct HTPasswd IDP page title', () => {
    expect(wrapper.contains(`${i18nNS}~Add Identity Provider: HTPasswd`)).toBeTruthy();
  });

  it('should render the form elements of AddHTPasswdPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(HTDroppableInput).length).toEqual(1);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper, 'public');
  });

  it('should prefill htpasswd in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual(wrapper.state().name);
  });
});
