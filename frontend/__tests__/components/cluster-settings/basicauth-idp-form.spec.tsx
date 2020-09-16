import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Button } from '@patternfly/react-core';

import { ButtonBar } from '../../../public/components/utils';
import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import {
  AddBasicAuthPage,
  AddBasicAuthPageState,
  DroppableFileInput as BasicDroppableInput,
} from '../../../public/components/cluster-settings/basicauth-idp-form';

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

const i18nNS = 'basicauth-idp-form';

export const controlButtonTest = (wrapper: ShallowWrapper, i18nNamespace) => {
  expect(wrapper.find(ButtonBar).exists()).toBe(true);
  expect(
    wrapper
      .find(Button)
      .at(0)
      .childAt(0)
      .text(),
  ).toEqual(`${i18nNamespace}~Add`);
  expect(
    wrapper
      .find(Button)
      .at(1)
      .childAt(0)
      .text(),
  ).toEqual(`${i18nNamespace}~Cancel`);
};

describe('Add Identity Provider: BasicAuthentication', () => {
  let wrapper: ShallowWrapper<{}, AddBasicAuthPageState>;

  beforeEach(() => {
    wrapper = shallow(<AddBasicAuthPage />);
  });

  it('should render AddBasicAuthPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct Basic Authentication IDP page title', () => {
    expect(wrapper.contains(`${i18nNS}~Add Identity Provider: Basic Authentication`)).toBeTruthy();
  });

  it('should render the form elements of AddBasicAuthPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find(BasicDroppableInput).length).toEqual(2);
    expect(wrapper.find('input[id="url"]').exists()).toBe(true);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper, 'public');
  });

  it('should prefill basic-auth in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual(wrapper.state().name);
  });
});
