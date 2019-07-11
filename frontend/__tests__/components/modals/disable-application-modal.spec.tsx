import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash-es';

import { DisableApplicationModal, DisableApplicationModalProps } from '../../../public/components/modals/disable-application-modal';
import { ModalTitle, ModalSubmitFooter } from '../../../public/components/factory/modal';
import { testSubscription } from '../../../__mocks__/k8sResourcesMocks';
import { SubscriptionKind } from '../../../public/components/operator-lifecycle-manager/index';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../../public/models';

describe(DisableApplicationModal.name, () => {
  let wrapper: ShallowWrapper<DisableApplicationModalProps>;
  let k8sKill: Spy;
  let k8sGet: Spy;
  let k8sPatch: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;

  const spyAndExpect = (spy: Spy) => (returnValue: any) => new Promise(resolve => spy.and.callFake((...args) => {
    resolve(args);
    return returnValue;
  }));

  beforeEach(() => {
    k8sKill = jasmine.createSpy('k8sKill').and.returnValue(Promise.resolve());
    k8sGet = jasmine.createSpy('k8sGet').and.returnValue(Promise.resolve());
    k8sPatch = jasmine.createSpy('k8sPatch').and.returnValue(Promise.resolve());
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscription = {..._.cloneDeep(testSubscription), status: {installedCSV: 'testapp.v1.0.0'}};

    wrapper = shallow(<DisableApplicationModal subscription={subscription} k8sKill={k8sKill} k8sGet={k8sGet} k8sPatch={k8sPatch} close={close} cancel={cancel} />).dive();
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Remove');
  });

  it('renders checkbox for setting cascading delete', () => {
    expect(wrapper.find('.co-delete-modal-checkbox-label').find('input').props().checked).toBe(true);
    expect(wrapper.find('.co-delete-modal-checkbox-label').text()).toContain('Also completely remove the Operator from the selected namespace.');
  });

  it('calls `props.k8sKill` to delete the subscription when form is submitted', (done) => {
    spyAndExpect(close)(null).then(() => {
      expect(k8sKill.calls.argsFor(0)[0]).toEqual(SubscriptionModel);
      expect(k8sKill.calls.argsFor(0)[1]).toEqual(subscription);
      expect(k8sKill.calls.argsFor(0)[2]).toEqual({});
      expect(k8sKill.calls.argsFor(0)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sKill` to delete the `ClusterServiceVersion` from the subscription namespace when form is submitted', (done) => {
    spyAndExpect(close)(null).then(() => {
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

    spyAndExpect(close)(null).then(() => {
      expect(k8sKill.calls.count()).toEqual(1);
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('does not call `props.k8sKill` to delete `ClusterServiceVersion` if `state.deleteCSV` is false', (done) => {
    wrapper.find('input').simulate('click');
    wrapper = wrapper.setProps({subscription: testSubscription});

    spyAndExpect(close)(null).then(() => {
      expect(k8sKill.calls.count()).toEqual(1);
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('adds delete options with `propagationPolicy` if cascading delete checkbox is checked', (done) => {
    spyAndExpect(close)(null).then(() => {
      expect(k8sKill.calls.argsFor(0)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      expect(k8sKill.calls.argsFor(1)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.close` after successful submit', (done) => {
    spyAndExpect(close)(null).then(() => {
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});
