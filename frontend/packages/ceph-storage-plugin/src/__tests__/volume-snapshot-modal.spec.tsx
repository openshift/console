import * as React from 'react';
import * as k8s from '@console/internal/module/k8s';
import { ShallowWrapper, shallow } from 'enzyme';
import { TextInput, FormGroup } from '@patternfly/react-core';

import { Dropdown } from '@console/internal/components/utils';
import { ModalTitle, ModalSubmitFooter } from '@console/internal/components/factory';

import { newSnapshotData, pvcData } from '../__mocks__/volume-snapshot-data';
import {
  snapshotTypes,
  VolumeSnapshotModal,
  VolumeSnapshotModalProps,
} from '../components/modals/volume-snapshot-modal/volume-snapshot-modal';
import { VolumeSnapshotModel } from '../models';

import Spy = jasmine.Spy;

describe(VolumeSnapshotModal.name, () => {
  let wrapper: ShallowWrapper<VolumeSnapshotModalProps>;
  let close: Spy;
  let cancel: Spy;

  const spyAndExpect = (spy: Spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.and.callFake((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  beforeEach(() => {
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');

    wrapper = shallow(
      <VolumeSnapshotModal close={close} cancel={cancel} pvcData={pvcData as any} />,
    ).dive();
  });

  it('renders a modal form', () => {
    expect(wrapper.find({ name: 'form' })).toHaveLength(1);
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Create');
  });

  it('renders a modal with placeholder name', () => {
    expect(wrapper.find(TextInput).exists()).toBe(true);
    expect(wrapper.find(TextInput).props().value).toEqual('fake-pvc-snapshot');
  });

  it('check for required field', () => {
    expect(
      wrapper
        .find(FormGroup)
        .at(0)
        .props().isRequired,
    ).toEqual(true);
  });

  it('renders dropdown for modal', () => {
    expect(wrapper.find('Dropdown').exists()).toBe(true);
    expect(wrapper.find(Dropdown).props().selectedKey).toEqual(snapshotTypes.Single);
  });

  it('calls `k8sCreate` to create volume snapshot', (done) => {
    wrapper.find(TextInput).simulate('change', 'fakeSnapshot');
    spyAndExpect(spyOn(k8s, 'k8sCreate'))(Promise.resolve({}))
      .then(([modelArgs, data]: [k8s.K8sKind, k8s.K8sResourceKind]) => {
        expect(modelArgs).toEqual(VolumeSnapshotModel);
        expect(data).toEqual(newSnapshotData.items[0]);
        done();
      })
      .catch((err) => fail(err));
    wrapper
      .find({ name: 'form' })
      .at(0)
      .simulate('submit', new Event('submit'));
  });
});
