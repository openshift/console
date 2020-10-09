import * as React from 'react';
import * as _ from 'lodash';
import { shallow, mount, ShallowWrapper, ReactWrapper } from 'enzyme';
import * as modal from '@console/internal/components/factory/modal';
import * as k8s from '@console/internal/module/k8s';
import { testResourceInstance, testModel } from '../../../../mocks';
import {
  ResourceRequirementsModal,
  ResourceRequirementsModalProps,
  ResourceRequirementsModalLink,
  ResourceRequirementsModalLinkProps,
} from './resource-requirements';
import { Button } from '@patternfly/react-core';

import Spy = jasmine.Spy;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe(ResourceRequirementsModal.name, () => {
  let wrapper: ReactWrapper<ResourceRequirementsModalProps>;
  const title = 'TestResource Resource Requests';
  const description = 'Define the resource requests for this TestResource instance.';
  const cancel = jasmine.createSpy('cancelSpy');

  const spyAndExpect = (spy: Spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.and.callFake((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  beforeEach(() => {
    wrapper = mount(
      <ResourceRequirementsModal
        title={title}
        description={description}
        obj={testResourceInstance}
        model={testModel}
        type="requests"
        cancel={cancel}
        path="resources"
        close={null}
      />,
    );
  });

  it('renders a modal form with given title and description', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(
      wrapper
        .find(modal.ModalTitle)
        .childAt(0)
        .text(),
    ).toEqual(title);
    expect(
      wrapper
        .find(modal.ModalBody)
        .childAt(0)
        .text(),
    ).toContain(description);
    expect(wrapper.find(modal.ModalSubmitFooter).props().submitText).toEqual('Save');
  });

  it('calls function to update resource instance when form is submitted', (done) => {
    wrapper.find('input[name="cpu"]').simulate('change', { target: { value: '200m' } });
    wrapper.find('input[name="memory"]').simulate('change', { target: { value: '20Mi' } });
    wrapper
      .find('input[name="ephemeral-storage"]')
      .simulate('change', { target: { value: '50Mi' } });

    spyAndExpect(spyOn(k8s, 'k8sUpdate'))(Promise.resolve())
      .then(([model, newObj]: [k8s.K8sKind, k8s.K8sResourceKind]) => {
        expect(model).toEqual(testModel);
        expect(newObj.spec.resources.requests).toEqual({
          cpu: '200m',
          memory: '20Mi',
          'ephemeral-storage': '50Mi',
        });
        done();
      })
      .catch((err) => fail(err));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});

describe(ResourceRequirementsModalLink.displayName, () => {
  let wrapper: ShallowWrapper<ResourceRequirementsModalLinkProps>;
  let obj: k8s.K8sResourceKind;

  beforeEach(() => {
    obj = _.cloneDeep(testResourceInstance);
    obj.spec.resources = {
      limits: { memory: '50Mi', cpu: '500m', 'ephemeral-storage': '50Mi' },
      requests: { memory: '50Mi', cpu: '500m', 'ephemeral-storage': '50Mi' },
    };
    wrapper = shallow(
      <ResourceRequirementsModalLink.WrappedComponent
        obj={obj}
        model={testModel}
        type="limits"
        path="resources"
      />,
    );
  });

  it('renders a button link with the resource requests limits', () => {
    const { memory, cpu, 'ephemeral-storage': storage } = obj.spec.resources.limits;
    wrapper = wrapper.setProps({ type: 'requests' });

    expect(
      wrapper
        .find(Button)
        .render()
        .text(),
    ).toEqual(`CPU: ${cpu}, Memory: ${memory}, Storage: ${storage}`);
  });

  it('renders a button link with the resource limits', () => {
    const { memory, cpu, 'ephemeral-storage': storage } = obj.spec.resources.requests;
    expect(
      wrapper
        .find(Button)
        .render()
        .text(),
    ).toEqual(`CPU: ${cpu}, Memory: ${memory}, Storage: ${storage}`);
  });

  it('renders default values if undefined', () => {
    obj.spec.resources = undefined;
    wrapper.setProps({ obj });

    expect(
      wrapper
        .find(Button)
        .render()
        .text(),
    ).toEqual('CPU: none, Memory: none, Storage: none');
  });

  it('opens resource requirements modal when clicked', (done) => {
    const modalSpy = jasmine.createSpy('modalSpy').and.callFake((args) => {
      expect(args.title).toEqual(`${obj.kind} Resource Limits`);
      expect(args.description).toEqual(`Define the resource limits for this ${obj.kind} instance.`);
      expect(args.obj).toEqual(obj);
      expect(args.model).toEqual(testModel);
      expect(args.type).toEqual('limits');
      expect(args.path).toEqual('resources');
      done();
    });
    spyOn(modal, 'createModalLauncher').and.returnValue(modalSpy);

    wrapper.find(Button).simulate('click');
  });
});
