import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux';

import { ButtonBar } from '../../../public/components/utils';
import { IDPNameInput } from '../../../public/components/cluster-settings/idp-name-input';
import { IDPCAFileInput } from '../../../public/components/cluster-settings/idp-cafile-input';
import {
  AddBasicAuthPage,
  DroppableFileInput as BasicDroppableInput,
} from '../../../public/components/cluster-settings/basicauth-idp-form';

export const controlButtonTest = (wrapper) => {
  expect(wrapper.find(ButtonBar).exists()).toBe(true);
  expect(wrapper.find('Button[type="submit"]').at(0).text()).toEqual('Add');
  expect(wrapper.find('Button[variant="secondary"]').at(0).text()).toEqual('Cancel');
};

describe('Add Identity Provider: BasicAuthentication', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <BrowserRouter>
          <AddBasicAuthPage />
        </BrowserRouter>
      </Provider>,
    );
  });

  it('should render AddBasicAuthPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct Basic Authentication IDP page title', () => {
    expect(wrapper.contains('Add Identity Provider: Basic Authentication')).toBeTruthy();
  });

  it('should render the form elements of AddBasicAuthPage component', () => {
    expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    expect(wrapper.find(BasicDroppableInput).length).toEqual(2);
    expect(wrapper.find('input[id="url"]').exists()).toBe(true);
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest(wrapper);
  });

  it('should prefill basic-auth in name field by default', () => {
    expect(wrapper.find(IDPNameInput).props().value).toEqual('basic-auth');
  });
});
