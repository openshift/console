import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;

import {
  ConnectedStorageClassForm,
  StorageClassFormProps,
  StorageClassFormState,
} from '../../public/components/storage-class-form';
import { PageHeading } from '../../public/components/utils';
import * as plugins from '@console/dynamic-plugin-sdk';

const extensions = [
  {
    properties: {
      OTHERS: {
        title: 'AWS Elastic Block Storage',
        provisioner: 'kubernetes.io/aws-ebs',
        allowVolumeExpansion: () => true,
        documentationLink: () => '',
        parameters: {
          type: {
            name: 'Type',
            values: { io1: 'io1', gp2: 'gp2', sc1: 'sc1', st1: 'st1' },
            hintText: 'Select AWS Type',
          },
        },
      },
    },
  },
];

describe(ConnectedStorageClassForm.displayName, () => {
  const Component: React.ComponentType<Omit<
    StorageClassFormProps,
    't' | 'i18n' | 'tReady'
  >> = ConnectedStorageClassForm.WrappedComponent as any;
  let wrapper: ShallowWrapper<StorageClassFormProps, StorageClassFormState>;
  let onClose: Spy;
  let watchK8sList: Spy;
  let stopK8sWatch: Spy;
  let k8s: Spy;
  let extensionSpy: Spy;

  beforeEach(() => {
    extensionSpy = spyOn(plugins, 'useResolvedExtensions').and.returnValue([
      extensions,
      true,
      null,
    ]);
    onClose = jasmine.createSpy('onClose');
    watchK8sList = jasmine.createSpy('watchK8sList');
    stopK8sWatch = jasmine.createSpy('stopK8sWatch');
    k8s = jasmine.createSpy('k8s');

    wrapper = shallow(
      <Component
        onClose={onClose}
        watchK8sList={watchK8sList}
        stopK8sWatch={stopK8sWatch}
        k8s={k8s}
      />,
    )
      .dive()
      .dive();
  });

  it('renders the proper header', () => {
    expect(wrapper.find(PageHeading).prop('title')).toEqual('StorageClass');
  });

  it('renders a form', () => {
    expect(wrapper.find('[data-test-id="storage-class-form"]').exists()).toBe(true);
  });

  it('renders a dropdown for selecting the reclaim policy', () => {
    expect(wrapper.find({ title: 'Select reclaim policy' }).exists()).toBe(true);
  });

  it('renders a text box for selecting the storage class name', () => {
    expect(wrapper.find('#storage-class-name').exists()).toBe(true);
  });

  it('renders type-specific settings when storage type is set', () => {
    expect(wrapper.find({ title: 'Select AWS Type' }).exists()).toBe(false);
    wrapper.setState({
      newStorageClass: {
        ...wrapper.state().newStorageClass,
        type: 'kubernetes.io/aws-ebs',
      },
    });
    wrapper.instance().componentDidUpdate({}, {});
    expect(extensionSpy).toHaveBeenCalled();
    wrapper.instance().forceUpdate();
    expect(wrapper.find({ title: 'Select AWS Type' }).exists()).toBe(true);
  });

  it('renders an error message when storage class creation fails', () => {
    const errorMsg = 'Storage creation failed';
    expect(wrapper.find({ errorMessage: errorMsg }).exists()).toBe(false);
    wrapper.setState({ error: { message: errorMsg } });
    expect(wrapper.find({ errorMessage: errorMsg }).exists()).toBe(true);
  });
});
