import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ListInput } from '../../../public/components/utils';
import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import {
  AddGitHubPage,
  AddGitHubPageState,
} from '../../../public/components/cluster-settings/github-idp-form';
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

const i18nNS = 'github-idp-form';

describe('Add Identity Provider: GitHub', () => {
  let wrapper: ShallowWrapper<{}, AddGitHubPageState>;

  beforeEach(() => {
    wrapper = shallow(<AddGitHubPage />);
  });

  it('should render AddGitHubPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct GitHub IDP page title', () => {
    expect(wrapper.contains(`${i18nNS}~Add Identity Provider: GitHub`)).toBeTruthy();
  });

  it('should render the form elements of AddGitHubPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find('input[id="client-id"]').exists()).toBe(true);
    expect(wrapper.find('input[id="client-secret"]').exists()).toBe(true);
    expect(wrapper.find('input[id="hostname"]').exists()).toBe(true);
    expect(wrapper.find(ListInput).length).toEqual(2);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper, 'public');
  });

  it('should prefill github in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual(wrapper.state().name);
  });

  it('should prefill GitHub list input default values as empty', () => {
    expect(
      wrapper
        .find(ListInput)
        .at(0)
        .props().initialValues,
    ).toEqual(undefined);
    expect(
      wrapper
        .find(ListInput)
        .at(1)
        .props().initialValues,
    ).toEqual(undefined);
  });
});
