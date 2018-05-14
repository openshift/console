/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash-es';

import { InstallPlanApprovalModal, InstallPlanApprovalModalProps, InstallPlanApprovalModalState } from '../../../public/components/modals/installplan-approval-modal';
import { ModalTitle, ModalSubmitFooter, ModalBody } from '../../../public/components/factory/modal';
import { testSubscription, testInstallPlan } from '../../../__mocks__/k8sResourcesMocks';
import { SubscriptionKind, InstallPlanApproval } from '../../../public/components/cloud-services/index';
import { SubscriptionModel, InstallPlanModel } from '../../../public/models';
import { RadioInput } from '../../../public/components/radio';

describe(InstallPlanApprovalModal.name, () => {
  let wrapper: ShallowWrapper<InstallPlanApprovalModalProps, InstallPlanApprovalModalState>;
  let k8sUpdate: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;

  beforeEach(() => {
    k8sUpdate = jasmine.createSpy('k8sUpdate').and.returnValue(Promise.resolve());
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscription = _.cloneDeep(testSubscription);

    wrapper = shallow(<InstallPlanApprovalModal obj={subscription} k8sUpdate={k8sUpdate} close={close} cancel={cancel} />);
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Save Channel');
  });

  it('renders a radio button for each available approval strategy', () => {
    expect(wrapper.find(ModalBody).find(RadioInput).length).toEqual(2);
  });

  it('pre-selects the approval strategy option that is currently being used by a subscription', () => {
    expect(wrapper.find(ModalBody).find(RadioInput).at(0).props().checked).toBe(true);
  });

  it('pre-selects the approval strategy option that is currently being used by an install plan', () => {
    wrapper = wrapper.setProps({obj: _.cloneDeep(testInstallPlan)});

    expect(wrapper.find(ModalBody).find(RadioInput).at(0).props().checked).toBe(true);
  });

  it('calls `props.k8sUpdate` to update the subscription when form is submitted', (done) => {
    wrapper = wrapper.setState({selectedApprovalStrategy: InstallPlanApproval.Manual});

    close.and.callFake(() => {
      expect(k8sUpdate.calls.argsFor(0)[0]).toEqual(SubscriptionModel);
      expect(k8sUpdate.calls.argsFor(0)[1]).toEqual({...subscription, spec: {...subscription.spec, installPlanApproval: InstallPlanApproval.Manual}});
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sUpdate` to update the install plan when form is submitted', (done) => {
    wrapper = wrapper.setProps({obj: _.cloneDeep(testInstallPlan)});
    wrapper = wrapper.setState({selectedApprovalStrategy: InstallPlanApproval.Manual});

    close.and.callFake(() => {
      expect(k8sUpdate.calls.argsFor(0)[0]).toEqual(InstallPlanModel);
      expect(k8sUpdate.calls.argsFor(0)[1]).toEqual({...testInstallPlan, spec: {...testInstallPlan.spec, approval: InstallPlanApproval.Manual}});
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
