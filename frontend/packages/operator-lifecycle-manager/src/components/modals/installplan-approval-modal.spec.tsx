import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import * as _ from 'lodash';
import {
  ModalTitle,
  ModalSubmitFooter,
  ModalBody,
} from '@console/internal/components/factory/modal';
import { RadioInput } from '@console/internal/components/radio';
import * as k8sModels from '@console/internal/module/k8s';
import { testSubscription, testInstallPlan } from '../../../mocks';
import { SubscriptionModel, InstallPlanModel } from '../../models';
import { SubscriptionKind, InstallPlanApproval } from '../../types';
import {
  InstallPlanApprovalModal,
  InstallPlanApprovalModalProps,
} from './installplan-approval-modal';
import Spy = jasmine.Spy;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe(InstallPlanApprovalModal.name, () => {
  let wrapper: ShallowWrapper<InstallPlanApprovalModalProps>;
  let k8sUpdate: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;

  beforeEach(() => {
    k8sUpdate = jasmine.createSpy().and.returnValue(Promise.resolve());
    close = jasmine.createSpy();
    cancel = jasmine.createSpy();
    subscription = _.cloneDeep(testSubscription);

    wrapper = shallow(
      <InstallPlanApprovalModal
        obj={subscription}
        k8sUpdate={k8sUpdate}
        close={close}
        cancel={cancel}
      />,
    );
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('public~Save');
  });

  it('renders a radio button for each available approval strategy', () => {
    expect(wrapper.find(ModalBody).find(RadioInput).length).toEqual(2);
  });

  it('pre-selects the approval strategy option that is currently being used by a subscription', () => {
    expect(
      wrapper
        .find(ModalBody)
        .find(RadioInput)
        .at(0)
        .props().checked,
    ).toBe(true);
  });

  it('pre-selects the approval strategy option that is currently being used by an install plan', () => {
    wrapper = wrapper.setProps({ obj: _.cloneDeep(testInstallPlan) });
    expect(
      wrapper
        .find(ModalBody)
        .find(RadioInput)
        .at(0)
        .props().checked,
    ).toBe(true);
  });

  it('calls `props.k8sUpdate` to update the subscription when form is submitted', () => {
    spyOn(k8sModels, 'modelFor').and.returnValue(SubscriptionModel);
    k8sUpdate.and.callFake((modelArg, subscriptionArg) => {
      expect(modelArg).toEqual(SubscriptionModel);
      expect(subscriptionArg?.spec?.installPlanApproval).toEqual(InstallPlanApproval.Manual);
      return Promise.resolve();
    });
    wrapper
      .find(ModalBody)
      .find(RadioInput)
      .at(1)
      .props()
      .onChange({ target: { value: InstallPlanApproval.Manual } });
    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sUpdate` to update the install plan when form is submitted', () => {
    wrapper = wrapper.setProps({ obj: _.cloneDeep(testInstallPlan) });
    spyOn(k8sModels, 'modelFor').and.returnValue(InstallPlanModel);
    k8sUpdate.and.callFake((modelArg, installPlanArg) => {
      expect(modelArg).toEqual(InstallPlanModel);
      expect(installPlanArg?.spec?.approval).toEqual(InstallPlanApproval.Manual);
      return Promise.resolve();
    });
    wrapper
      .find(ModalBody)
      .find(RadioInput)
      .at(1)
      .props()
      .onChange({ target: { value: InstallPlanApproval.Manual } });
    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.close` after successful submit', (done) => {
    close.and.callFake(() => {
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});
