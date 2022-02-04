import * as React from 'react';
import { ReactWrapper, mount } from 'enzyme';
import * as _ from 'lodash';
import { act } from 'react-dom/test-utils';
import { ModalTitle, ModalSubmitFooter } from '@console/internal/components/factory/modal';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useOperands } from '@console/shared/src/hooks/useOperands';
import { testSubscription, dummyPackageManifest } from '../../../mocks';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { SubscriptionKind } from '../../types';
import { UninstallOperatorModal, UninstallOperatorModalProps } from './uninstall-operator-modal';
import Spy = jasmine.Spy;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useOperands', () => ({
  useOperands: jest.fn(),
}));

describe(UninstallOperatorModal.name, () => {
  let wrapper: ReactWrapper<UninstallOperatorModalProps>;
  let k8sKill: Spy;
  let k8sGet: Spy;
  let k8sPatch: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;

  const spyAndExpect = (spy: Spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.and.callFake((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  beforeEach(() => {
    k8sKill = jasmine.createSpy('k8sKill').and.returnValue(Promise.resolve());
    k8sGet = jasmine.createSpy('k8sGet').and.returnValue(Promise.resolve());
    k8sPatch = jasmine.createSpy('k8sPatch').and.returnValue(Promise.resolve());
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscription = { ..._.cloneDeep(testSubscription), status: { installedCSV: 'testapp.v1.0.0' } };

    (useK8sWatchResource as jest.Mock).mockReturnValue([dummyPackageManifest, true, null]);
    (useAccessReview as jest.Mock).mockReturnValue(false);
    (useOperands as jest.Mock).mockReturnValue([[], true, '']);

    // React.useEffect is not supported by Enzyme's shallow rendering, switching to mount
    wrapper = mount(
      <UninstallOperatorModal
        subscription={subscription}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Uninstall');
  });

  it('calls `props.k8sKill` to delete the subscription when form is submitted', async () => {
    await act(async () => {
      wrapper.find('form').simulate('submit', new Event('submit'));
      await spyAndExpect(close)(null);
    });

    expect(k8sKill).toHaveBeenCalledTimes(2);
    expect(k8sKill.calls.argsFor(0)[0]).toEqual(SubscriptionModel);
    expect(k8sKill.calls.argsFor(0)[1]).toEqual(subscription);
    expect(k8sKill.calls.argsFor(0)[2]).toEqual({});
    expect(k8sKill.calls.argsFor(0)[3]).toEqual({
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy: 'Foreground',
    });
  });

  it('calls `props.k8sKill` to delete the `ClusterServiceVersion` from the subscription namespace when form is submitted', async () => {
    await act(async () => {
      wrapper.find('form').simulate('submit', new Event('submit'));
      await spyAndExpect(close)(null);
    });

    expect(k8sKill).toHaveBeenCalledTimes(2);
    expect(k8sKill.calls.argsFor(1)[0]).toEqual(ClusterServiceVersionModel);
    expect(k8sKill.calls.argsFor(1)[1].metadata.namespace).toEqual(
      testSubscription.metadata.namespace,
    );
    expect(k8sKill.calls.argsFor(1)[1].metadata.name).toEqual('testapp.v1.0.0');
    expect(k8sKill.calls.argsFor(1)[2]).toEqual({});
    expect(k8sKill.calls.argsFor(1)[3]).toEqual({
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy: 'Foreground',
    });
  });

  it('does not call `props.k8sKill` to delete `ClusterServiceVersion` if `status.installedCSV` field missing from subscription', async () => {
    wrapper = wrapper.setProps({ subscription: testSubscription });

    await act(async () => {
      wrapper.find('form').simulate('submit', new Event('submit'));
      await spyAndExpect(close)(null);
    });

    expect(k8sKill).toHaveBeenCalledTimes(1);
  });

  it('adds delete options with `propagationPolicy`', async () => {
    await act(async () => {
      wrapper.find('form').simulate('submit', new Event('submit'));
      spyAndExpect(close)(null);
    });

    expect(k8sKill).toHaveBeenCalledTimes(2);
    expect(k8sKill.calls.argsFor(0)[3]).toEqual({
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy: 'Foreground',
    });
    expect(k8sKill.calls.argsFor(1)[3]).toEqual({
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy: 'Foreground',
    });
  });

  it('calls `props.close` after successful submit', async () => {
    await act(async () => {
      wrapper.find('form').simulate('submit', new Event('submit'));
      spyAndExpect(close)(null);
    });
  });
});
