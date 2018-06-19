/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash-es';

import { SubscriptionChannelModal, SubscriptionChannelModalProps, SubscriptionChannelModalState } from '../../../public/components/modals/subscription-channel-modal';
import { ModalTitle, ModalSubmitFooter, ModalBody } from '../../../public/components/factory/modal';
import { testSubscription } from '../../../__mocks__/k8sResourcesMocks';
import { SubscriptionKind, Package } from '../../../public/components/cloud-services/index';
import { SubscriptionModel } from '../../../public/models';
import { RadioInput } from '../../../public/components/radio';

describe(SubscriptionChannelModal.name, () => {
  let wrapper: ShallowWrapper<SubscriptionChannelModalProps, SubscriptionChannelModalState>;
  let k8sUpdate: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;
  let pkg: Package;

  beforeEach(() => {
    k8sUpdate = jasmine.createSpy('k8sUpdate').and.returnValue(Promise.resolve());
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscription = _.cloneDeep(testSubscription);
    pkg = {
      packageName: 'testapp-package',
      channels: [{name: 'stable', currentCSV: 'testapp'}, {name: 'nightly', currentCSV: 'testapp-nightly'}],
      defaultChannel: 'stable',
    };

    wrapper = shallow(<SubscriptionChannelModal subscription={subscription} pkg={pkg} k8sUpdate={k8sUpdate} close={close} cancel={cancel} />);
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Save Channel');
  });

  it('renders a radio button for each available channel in the package', () => {
    expect(wrapper.find(ModalBody).find(RadioInput).length).toEqual(pkg.channels.length);
  });

  it('calls `props.k8sUpdate` to update the subscription when form is submitted', (done) => {
    wrapper = wrapper.setState({selectedChannel: 'nightly'});

    close.and.callFake(() => {
      expect(k8sUpdate.calls.argsFor(0)[0]).toEqual(SubscriptionModel);
      expect(k8sUpdate.calls.argsFor(0)[1]).toEqual({...subscription, spec: {...subscription.spec, channel: 'nightly'}});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.close` after successful submit', (done) => {
    close.and.callFake(() => {
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});
