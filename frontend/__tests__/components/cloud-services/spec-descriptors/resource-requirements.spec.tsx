/* eslint-disable no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { shallow, ShallowWrapper } from 'enzyme';

import { ResourceRequirementsModal, ResourceRequirementsModalProps, ResourceRequirementsModalLink, ResourceRequirementsModalLinkProps } from '../../../../public/components/cloud-services/spec-descriptors/resource-requirements';
import { ClusterServiceVersionResourceKind } from '../../../../public/components/cloud-services/index';
import { testResourceInstance } from '../../../../__mocks__/k8sResourcesMocks';
import * as modal from '../../../../public/components/factory/modal';
import * as k8s from '../../../../public/module/k8s';

describe(ResourceRequirementsModal.name, () => {
  let wrapper: ShallowWrapper<ResourceRequirementsModalProps>;
  const title = 'TestResource Request Limits';
  const description = 'Define the request limits for this TestResource instance.';
  const cancel = jasmine.createSpy('cancelSpy');

  beforeEach(() => {
    const Form: any = () => <div />;
    Form.formName = 'ResourceRequirements';
    wrapper = shallow(<ResourceRequirementsModal title={title} description={description} obj={testResourceInstance} type="requests" cancel={cancel} Form={Form} path="resources" />);
  });

  it('renders a modal form with given title and description', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find(modal.ModalTitle).childAt(0).text()).toEqual(title);
    expect(wrapper.find(modal.ModalBody).childAt(0).text()).toContain(description);
    expect(wrapper.find(modal.ModalSubmitFooter).props().submitText).toEqual('Save Changes');
  });

  it('calls function to update resource instance when form is submitted', (done) => {
    spyOn(k8s, 'k8sUpdate').and.callFake((k8sModel, updatedObj) => Promise.resolve().then(() => {
      setTimeout(() => {
        expect(cancel).toHaveBeenCalled();
        done();
      }, 10);
    }));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});

describe(ResourceRequirementsModalLink.displayName, () => {
  let wrapper: ShallowWrapper<ResourceRequirementsModalLinkProps>;
  let obj: ClusterServiceVersionResourceKind;
  const onChangeSpy = jasmine.createSpy('onChangeSpy').and.returnValue(Promise.resolve());

  beforeEach(() => {
    obj = _.cloneDeep(testResourceInstance);
    obj.spec.resources = {limits: {memory: '50Mi', cpu: '500m'}, requests: {memory: '50Mi', cpu: '500m'}};
    wrapper = shallow(<ResourceRequirementsModalLink obj={obj} type="limits" path="resources" onChange={onChangeSpy} />);
  });

  it('renders a link with the resource requests limits', () => {
    const {memory, cpu} = obj.spec.resources.limits;
    wrapper = wrapper.setProps({type: 'requests'});

    expect(wrapper.find('a').text()).toEqual(`CPU: ${cpu}, Memory: ${memory}`);
  });

  it('renders a link with the resource limits', () => {
    const {memory, cpu} = obj.spec.resources.requests;
    expect(wrapper.find('a').text()).toEqual(`CPU: ${cpu}, Memory: ${memory}`);
  });

  it('renders default values if undefined', () => {
    obj.spec.resources = undefined;
    wrapper.setProps({obj});

    expect(wrapper.find('a').text()).toEqual('CPU: none, Memory: none');
  });

  it('opens resource requirements modal when clicked', () => {
    const modalSpy = jasmine.createSpy('modalSpy');
    spyOn(modal, 'createModalLauncher').and.returnValue(modalSpy);
    wrapper.find('a').simulate('click');

    expect(modalSpy.calls.count()).toEqual(1);
    expect(modalSpy.calls.argsFor(0)[0].title).toEqual(`${obj.kind} Resource Limits`);
    expect(modalSpy.calls.argsFor(0)[0].description).toEqual(`Define the resource limits for this ${obj.kind} instance.`);
    expect(modalSpy.calls.argsFor(0)[0].obj).toEqual(obj);
    expect(modalSpy.calls.argsFor(0)[0].Form).toBeDefined();
    expect(modalSpy.calls.argsFor(0)[0].type).toEqual('limits');
    expect(modalSpy.calls.argsFor(0)[0].path).toEqual('resources');
  });

  it('passes function to modal which calls `onChange` when cancelled', (done) => {
    const spy = spyOn(modal, 'createModalLauncher').and.callThrough();
    wrapper.find('a').simulate('click');
    const Modal = spy.calls.argsFor(0)[0];
    const cancelSpy = jasmine.createSpy('cancelSpy');
    const modalWrapper = shallow(<Modal cancel={cancelSpy} />);

    modalWrapper.find(ResourceRequirementsModal).props().cancel().then(() => {
      expect(onChangeSpy).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
      done();
    });
  });
});
