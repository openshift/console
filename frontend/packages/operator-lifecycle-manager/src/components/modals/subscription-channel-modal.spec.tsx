import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import * as _ from 'lodash';
import {
  ModalTitle,
  ModalSubmitFooter,
  ModalBody,
} from '@console/internal/components/factory/modal';
import { RadioInput } from '@console/internal/components/radio';
import { testSubscription, testPackageManifest } from '../../../mocks';
import { SubscriptionModel } from '../../models';
import { SubscriptionKind, PackageManifestKind } from '../../types';
import {
  SubscriptionChannelModal,
  SubscriptionChannelModalProps,
} from './subscription-channel-modal';
import Spy = jasmine.Spy;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('SubscriptionChannelModal', () => {
  let wrapper: ShallowWrapper<SubscriptionChannelModalProps>;
  let k8sUpdate: Spy;
  let close: Spy;
  let cancel: Spy;
  let subscription: SubscriptionKind;
  let pkg: PackageManifestKind;

  beforeEach(() => {
    k8sUpdate = jasmine.createSpy('k8sUpdate').and.returnValue(Promise.resolve());
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscription = _.cloneDeep(testSubscription);
    pkg = _.cloneDeep(testPackageManifest);
    pkg.status.defaultChannel = 'stable';
    pkg.status.channels = [
      {
        name: 'stable',
        currentCSV: 'testapp',
        currentCSVDesc: {
          displayName: 'Test App',
          icon: [{ mediatype: 'image/png', base64data: '' }],
          version: '0.0.1',
          provider: {
            name: 'CoreOS, Inc',
          },
          installModes: [],
        },
      },
      {
        name: 'nightly',
        currentCSV: 'testapp-nightly',
        currentCSVDesc: {
          displayName: 'Test App',
          icon: [{ mediatype: 'image/png', base64data: '' }],
          version: '0.0.1',
          provider: {
            name: 'CoreOS, Inc',
          },
          installModes: [],
        },
      },
    ];

    wrapper = shallow(
      <SubscriptionChannelModal
        subscription={subscription}
        pkg={pkg}
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

  it('renders a radio button for each available channel in the package', () => {
    expect(wrapper.find(ModalBody).find(RadioInput).length).toEqual(pkg.status.channels.length);
  });

  it('calls `props.k8sUpdate` to update the subscription when form is submitted', (done) => {
    k8sUpdate.and.callFake((model, obj) => {
      expect(model).toEqual(SubscriptionModel);
      expect(obj.spec.channel).toEqual('nightly');
      done();
      return Promise.resolve();
    });
    wrapper
      .find(RadioInput)
      .at(1)
      .props()
      .onChange({ target: { value: 'nightly' } });
    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.close` after successful submit', (done) => {
    close.and.callFake(() => {
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});
