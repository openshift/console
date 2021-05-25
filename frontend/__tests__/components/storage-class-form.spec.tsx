import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import { TFunction } from 'i18next';

import {
  StorageClassProvisioner,
  ExtensionSCProvisionerProp,
} from '@console/plugin-sdk/src/typings/storage-class-params';

import {
  ConnectedStorageClassForm,
  StorageClassFormProps,
  StorageClassFormState,
  StorageClassFormExtensionProps,
} from '../../public/components/storage-class-form';

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

const i18nNS = 'public';

describe(ConnectedStorageClassForm.displayName, () => {
  const Component: React.ComponentType<StorageClassFormProps &
    StorageClassFormExtensionProps> = ConnectedStorageClassForm.WrappedComponent as any;
  let wrapper: ShallowWrapper<StorageClassFormProps, StorageClassFormState>;
  let onClose: Spy;
  let watchK8sList: Spy;
  let stopK8sWatch: Spy;
  let k8s: Spy;
  let params: StorageClassProvisioner[];
  let extensionFunction: ExtensionSCProvisionerProp;

  beforeEach(() => {
    onClose = jasmine.createSpy('onClose');
    watchK8sList = jasmine.createSpy('watchK8sList');
    stopK8sWatch = jasmine.createSpy('stopK8sWatch');
    k8s = jasmine.createSpy('k8s');
    params = [
      {
        type: 'StorageClass/Provisioner',
        properties: {
          getStorageClassProvisioner: extensionFunction,
        },
      },
    ];

    wrapper = shallow(
      <Component
        onClose={onClose}
        watchK8sList={watchK8sList}
        stopK8sWatch={stopK8sWatch}
        k8s={k8s}
        t={((key) => key) as TFunction}
        i18n={null}
        tReady={true}
        params={params}
      />,
    );
  });

  it('renders the proper header', () => {
    expect(wrapper.find('.co-m-pane__name').text()).toEqual(`${i18nNS}~StorageClass`);
  });

  it('renders a form', () => {
    expect(wrapper.find('[data-test-id="storage-class-form"]').exists()).toBe(true);
  });

  it('renders a dropdown for selecting the reclaim policy', () => {
    expect(wrapper.find({ title: `${i18nNS}~Select reclaim policy` }).exists()).toBe(true);
  });

  it('renders a text box for selecting the storage class name', () => {
    expect(wrapper.find('#storage-class-name').exists()).toBe(true);
  });

  it('renders type-specific settings when storage type is set', () => {
    expect(wrapper.find({ title: 'Select AWS Type' }).exists()).toBe(false);
    wrapper.setState({
      newStorageClass: {
        ...wrapper.state().newStorageClass,
        type: 'aws',
      },
    });
    expect(wrapper.find({ title: 'Select AWS Type' }).exists()).toBe(true);
  });

  it('renders an error message when storage class creation fails', () => {
    const errorMsg = 'Storage creation failed';
    expect(wrapper.find({ errorMessage: errorMsg }).exists()).toBe(false);
    wrapper.setState({ error: { message: errorMsg } });
    expect(wrapper.find({ errorMessage: errorMsg }).exists()).toBe(true);
  });
});
