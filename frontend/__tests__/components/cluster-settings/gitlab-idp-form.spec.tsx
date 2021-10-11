import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import {
  AddGitLabPage,
  AddGitLabPageState,
} from '../../../public/components/cluster-settings/gitlab-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

describe('Add Identity Provider: GitLab', () => {
  let wrapper: ShallowWrapper<{}, AddGitLabPageState>;

  beforeEach(() => {
    wrapper = shallow(<AddGitLabPage />).dive();
  });

  it('should render AddGitLabPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct GitLab IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: GitLab')).toBeTruthy();
  });

  it('should render the form elements of AddGitLabPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find('input[id="url"]').exists()).toBe(true);
    expect(wrapper.find('input[id="client-id"]').exists()).toBe(true);
    expect(wrapper.find('input[id="client-secret"]').exists()).toBe(true);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill gitlab in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual(wrapper.state().name);
  });
});
