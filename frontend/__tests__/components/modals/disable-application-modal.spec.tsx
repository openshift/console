/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash-es';

import { DisableApplicationModal, DisableApplicationModalProps, DisableApplicationModalState } from '../../../public/components/modals/disable-application-modal';
import { ModalTitle, ModalSubmitFooter } from '../../../public/components/factory/modal';
import { testSubscription } from '../../../__mocks__/k8sResourcesMocks';
import { SubscriptionKind } from '../../../public/components/cloud-services/index';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../../public/models';

describe(DisableApplicationModal.name, () => {
  let wrapper: ShallowWrapper<DisableApplicationModalProps, DisableApplicationModalState>;
  let k8sKill: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;

  beforeEach(() => {
    k8sKill = jasmine.createSpy('k8sKill');
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscription = {..._.cloneDeep(testSubscription), status: {installedCSV: 'testapp.v1.0.0'}};

    wrapper = shallow(<DisableApplicationModal subscription={subscription} k8sKill={k8sKill} close={close} cancel={cancel} />);
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Remove');
  });

  it('renders checkbox for setting cascading delete', () => {
    expect(wrapper.find('.co-delete-modal-checkbox-label').find('input').props().checked).toBe(true);
    expect(wrapper.find('.co-delete-modal-checkbox-label').text()).toContain('Also completely remove the test-package Operator from the selected namespace.');
  });

  it('calls `props.k8sKill` to delete the subscription when form is submitted', (done) => {
    close.and.callFake(() => {
      expect(k8sKill.calls.argsFor(0)[0]).toEqual(SubscriptionModel);
      expect(k8sKill.calls.argsFor(0)[1]).toEqual(subscription);
      expect(k8sKill.calls.argsFor(0)[2]).toEqual({});
      expect(k8sKill.calls.argsFor(0)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sKill` to delete the `ClusterServiceVersion` from the subscription namespace when form is submitted', (done) => {
    close.and.callFake(() => {
      expect(k8sKill.calls.argsFor(1)[0]).toEqual(ClusterServiceVersionModel);
      expect(k8sKill.calls.argsFor(1)[1].metadata.namespace).toEqual(testSubscription.metadata.namespace);
      expect(k8sKill.calls.argsFor(1)[1].metadata.name).toEqual('testapp.v1.0.0');
      expect(k8sKill.calls.argsFor(1)[2]).toEqual({});
      expect(k8sKill.calls.argsFor(1)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('does not call `props.k8sKill` to delete `ClusterServiceVersion` if `status.installedCSV` field missing from subscription', (done) => {
    wrapper = wrapper.setProps({subscription: testSubscription});

    close.and.callFake(() => {
      expect(k8sKill.calls.count()).toEqual(1);
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('does not call `props.k8sKill` to delete `ClusterServiceVersion` if `state.deleteCSV` is false', (done) => {
    wrapper = wrapper.setState({deleteCSV: false});
    wrapper = wrapper.setProps({subscription: testSubscription});

    close.and.callFake(() => {
      expect(k8sKill.calls.count()).toEqual(1);
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('adds delete options with `propagationPolicy` if cascading delete checkbox is checked', (done) => {
    wrapper = wrapper.setState({deleteCSV: true});

    close.and.callFake(() => {
      expect(k8sKill.calls.argsFor(0)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      expect(k8sKill.calls.argsFor(1)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
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
