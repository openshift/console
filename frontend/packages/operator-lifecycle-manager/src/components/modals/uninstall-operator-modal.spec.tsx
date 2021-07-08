import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import * as _ from 'lodash';
import { ModalTitle, ModalSubmitFooter } from '@console/internal/components/factory/modal';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { testSubscription, dummyPackageManifest } from '../../../mocks';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { SubscriptionKind } from '../../types';
import { UninstallOperatorModal, UninstallOperatorModalProps } from './uninstall-operator-modal';
import Spy = jasmine.Spy;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe(UninstallOperatorModal.name, () => {
  let wrapper: ShallowWrapper<UninstallOperatorModalProps>;
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

    wrapper = shallow(
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

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('olm~Uninstall');
  });

  it('calls `props.k8sKill` to delete the subscription when form is submitted', (done) => {
    spyAndExpect(close)(null)
      .then(() => {
        expect(k8sKill.calls.argsFor(0)[0]).toEqual(SubscriptionModel);
        expect(k8sKill.calls.argsFor(0)[1]).toEqual(subscription);
        expect(k8sKill.calls.argsFor(0)[2]).toEqual({});
        expect(k8sKill.calls.argsFor(0)[3]).toEqual({
          kind: 'DeleteOptions',
          apiVersion: 'v1',
          propagationPolicy: 'Foreground',
        });
        done();
      })
      .catch((err) => fail(err));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.k8sKill` to delete the `ClusterServiceVersion` from the subscription namespace when form is submitted', (done) => {
    spyAndExpect(close)(null)
      .then(() => {
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
        done();
      })
      .catch((err) => fail(err));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('does not call `props.k8sKill` to delete `ClusterServiceVersion` if `status.installedCSV` field missing from subscription', (done) => {
    wrapper = wrapper.setProps({ subscription: testSubscription });

    spyAndExpect(close)(null)
      .then(() => {
        expect(k8sKill.calls.count()).toEqual(1);
        done();
      })
      .catch((err) => fail(err));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('adds delete options with `propagationPolicy`', (done) => {
    spyAndExpect(close)(null)
      .then(() => {
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
        done();
      })
      .catch((err) => fail(err));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.close` after successful submit', (done) => {
    spyAndExpect(close)(null)
      .then(() => {
        done();
      })
      .catch((err) => fail(err));

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});
