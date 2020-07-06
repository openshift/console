import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import { TextInput, FormGroup, Grid } from '@patternfly/react-core';

import { ModalTitle, ModalSubmitFooter } from '@console/internal/components/factory';

import {
  RestorePVCModalProps,
  RestorePVCModal,
} from '../components/modals/restore-pvc-modal/restore-pvc-modal';
import { snapshotData } from '../__mocks__/volume-snapshot-data';

import Spy = jasmine.Spy;

describe(RestorePVCModal.name, () => {
  let wrapper: ShallowWrapper<RestorePVCModalProps>;
  let close: Spy;
  let cancel: Spy;

  beforeEach(() => {
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    wrapper = shallow(
      <RestorePVCModal close={close} cancel={cancel} resource={snapshotData.items[0]} />,
    ).dive();
  });

  it('renders a modal form', () => {
    expect(wrapper.find({ name: 'form' })).toHaveLength(1);
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Restore');
  });

  it('renders a modal with default name', () => {
    expect(wrapper.find(TextInput).exists()).toBe(true);
    expect(wrapper.find(TextInput).props().value).toEqual('fakeSnapshot-restore');
  });

  it('check for required field', () => {
    expect(
      wrapper
        .find(FormGroup)
        .at(0)
        .props().isRequired,
    ).toEqual(true);
  });

  it('check for other field', () => {
    expect(wrapper.find(Grid).exists()).toBe(true);
    expect(wrapper.find('[data-test-id="snapshot-name"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="snapshot-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="snapshot-size"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="snapshot-ns"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="snapshot-apiversion"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="snapshot-source"]').exists()).toBe(true);
  });
});
