import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux';

import { ListInput } from '../../../public/components/utils';
import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import { AddOpenIDIDPPage } from '../../../public/components/cluster-settings/openid-idp-form';
import { controlButtonTest } from './basicauth-idp-form.spec';

describe('Add Identity Provider: OpenID Connect', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <BrowserRouter>
          <AddOpenIDIDPPage />
        </BrowserRouter>
      </Provider>,
    );
  });

  it('should render AddOpenIDIDPPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct OpenID Connect IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: OpenID Connect')).toBeTruthy();
  });

  it('should render the form elements of AddOpenIDIDPPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find('input[id="client-id"]').exists()).toBe(true);
    expect(wrapper.find('input[id="client-secret"]').exists()).toBe(true);
    expect(wrapper.find('input[id="issuer"]').exists()).toBe(true);
    expect(wrapper.find(ListInput).length).toEqual(4);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill openid in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual('openid');
  });

  it('should prefill OpenID list input default values', () => {
    expect(wrapper.find(ListInput).at(0).props().initialValues).toEqual(['preferred_username']);
    expect(wrapper.find(ListInput).at(1).props().initialValues).toEqual(['name']);
    expect(wrapper.find(ListInput).at(2).props().initialValues).toEqual(['email']);
    expect(wrapper.find(ListInput).at(3).props().initialValues).toEqual(undefined);
  });
});
