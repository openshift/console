import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux';

import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import {
  AddKeystonePage,
  DroppableFileInput as KeystoneFileInput,
} from '../../../public/components/cluster-settings/keystone-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

describe('Add Identity Provider: Keystone', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <BrowserRouter>
          <AddKeystonePage />
        </BrowserRouter>
      </Provider>,
    );
  });

  it('should render AddKeystonePage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct Keystone IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: Keystone Authentication')).toBeTruthy();
  });

  it('should render the form elements of AddKeystonePage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find(KeystoneFileInput).length).toEqual(2);
    expect(wrapper.find('input[id="url"]').exists()).toBe(true);
    expect(wrapper.find('input[id="domain-name"]').exists()).toBe(true);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill keystone in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual('keystone');
  });
});
