/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash-es';

import { DisableApplicationModal, DisableApplicationModalProps, DisableApplicationModalState } from '../../../public/components/modals/disable-application-modal';
import { ModalTitle, ModalSubmitFooter } from '../../../public/components/factory/modal';
import { testSubscription } from '../../../__mocks__/k8sResourcesMocks';
import { SubscriptionKind } from '../../../public/components/operator-lifecycle-manager/index';
import { ClusterServiceVersionModel, SubscriptionModel, CatalogSourceConfigModel } from '../../../public/models';
import { apiVersionForModel } from '../../../public/module/k8s';

describe(DisableApplicationModal.name, () => {
  let wrapper: ShallowWrapper<DisableApplicationModalProps, DisableApplicationModalState>;
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

    wrapper = shallow(<DisableApplicationModal subscription={subscription} k8sKill={k8sKill} k8sGet={k8sGet} k8sPatch={k8sPatch} close={close} cancel={cancel} />);
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
    wrapper = wrapper.setState({deleteCSV: false});
    wrapper = wrapper.setProps({subscription: testSubscription});

    spyAndExpect(close)(null).then(() => {
      expect(k8sKill.calls.count()).toEqual(1);
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('adds delete options with `propagationPolicy` if cascading delete checkbox is checked', (done) => {
    wrapper = wrapper.setState({deleteCSV: true});

    spyAndExpect(close)(null).then(() => {
      expect(k8sKill.calls.argsFor(0)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      expect(k8sKill.calls.argsFor(1)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sKill` to update `CatalogSourceConfig` if subscription contains appropriate labels', (done) => {
    subscription.metadata.labels = {
      'csc-owner-name': 'test-csc',
      'csc-owner-namespace': 'default',
    };
    wrapper = wrapper.setProps({subscription});

    const catalogSourceConfig = {
      apiVersion: apiVersionForModel(CatalogSourceConfigModel),
      kind: CatalogSourceConfigModel.kind,
      spec: {packages: [subscription.spec.name].join(',')},
    };
    k8sGet.and.returnValue(Promise.resolve(catalogSourceConfig));

    spyAndExpect(close)(null).then(() => {
      expect(k8sGet.calls.count()).toEqual(1);
      expect(k8sKill.calls.argsFor(2)[1]).toEqual(catalogSourceConfig);
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sKill` to delete `CatalogSourceConfig` if subscription contains appropriate labels and is the last entry in `spec.packages`', (done) => {
    subscription.metadata.labels = {
      'csc-owner-name': 'test-csc',
      'csc-owner-namespace': 'default',
    };
    wrapper = wrapper.setProps({subscription});

    const catalogSourceConfig = {
      apiVersion: apiVersionForModel(CatalogSourceConfigModel),
      kind: CatalogSourceConfigModel.kind,
      spec: {packages: [subscription.spec.name, 'other-package'].join(',')},
    };
    k8sGet.and.returnValue(Promise.resolve(catalogSourceConfig));

    spyAndExpect(close)(null).then(() => {
      expect(k8sGet.calls.count()).toEqual(1);
      expect(k8sKill.calls.count()).toEqual(2);
      expect(k8sPatch.calls.argsFor(0)[1]).toEqual(catalogSourceConfig);
      expect(k8sPatch.calls.argsFor(0)[2]).toEqual([{op: 'replace', path: '/spec/packages', value: 'other-package'}]);
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
