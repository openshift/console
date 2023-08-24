import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux';

import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import {
  AddHTPasswdPage,
  DroppableFileInput as HTDroppableInput,
} from '../../../public/components/cluster-settings/htpasswd-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

describe('Add Identity Provider: HTPasswd', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <BrowserRouter>
          <AddHTPasswdPage />
        </BrowserRouter>
      </Provider>,
    );
  });

  it('should render AddHTPasswdPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct HTPasswd IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: HTPasswd')).toBeTruthy();
  });

  it('should render the form elements of AddHTPasswdPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(HTDroppableInput).length).toEqual(1);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill htpasswd in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual('htpasswd');
  });
});
