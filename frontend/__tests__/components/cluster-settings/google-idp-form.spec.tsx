import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import {
  AddGooglePage,
  AddGooglePageState,
} from '../../../public/components/cluster-settings/google-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

describe('Add Identity Provider: Google', () => {
  let wrapper: ShallowWrapper<{}, AddGooglePageState>;

  beforeEach(() => {
    wrapper = shallow(<AddGooglePage />).dive();
  });

  it('should render AddGooglePage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct Google IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: Google')).toBeTruthy();
  });

  it('should render the form elements of AddGooglePage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find('input[id="hosted-domain"]').exists()).toBe(true);
    expect(wrapper.find('input[id="client-id"]').exists()).toBe(true);
    expect(wrapper.find('input[id="client-secret"]').exists()).toBe(true);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill google in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual(wrapper.state().name);
  });
});
