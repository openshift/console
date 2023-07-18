import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;

import {
  ConnectedStorageClassForm,
  StorageClassFormProps,
} from '../../public/components/storage-class-form';
import { PageHeading } from '../../public/components/utils';

describe(ConnectedStorageClassForm.displayName, () => {
  const Component: React.ComponentType<Omit<
    StorageClassFormProps,
    't' | 'i18n' | 'tReady'
  >> = ConnectedStorageClassForm.WrappedComponent as any;
  let wrapper: ShallowWrapper<StorageClassFormProps>;
  let onClose: Spy;
  let watchK8sList: Spy;
  let stopK8sWatch: Spy;
  let k8s: Spy;

  beforeEach(() => {
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
    ).dive();
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
    expect(wrapper.find({ children: 'Additional parameters' }).exists()).toBe(false);
    wrapper.find('#storage-class-provisioner').invoke('onChange')('kubernetes.io/aws-ebs' as any);
    wrapper.update();
    expect(wrapper.find({ children: 'Additional parameters' }).exists()).toBe(true);
  });

  it('renders an error message with invalid input', () => {
    const input = wrapper.find('#storage-class-name');
    input.simulate('change', { target: { value: 'Changed' } });
    input.simulate('change', { target: { value: '' } });
    expect(wrapper.find('.help-block').first().render().text() === 'Storage name is required');
  });
});
