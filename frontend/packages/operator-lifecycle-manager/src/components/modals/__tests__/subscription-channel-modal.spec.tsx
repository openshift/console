import { screen, fireEvent, waitFor } from '@testing-library/react';
import * as _ from 'lodash';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testSubscription, testPackageManifest } from '../../../../mocks';
import { SubscriptionModel } from '../../../models';
import { SubscriptionKind, PackageManifestKind } from '../../../types';
import {
  SubscriptionChannelModal,
  SubscriptionChannelModalProps,
} from '../subscription-channel-modal';

jest.mock('@console/internal/components/factory/modal', () => ({
  ...jest.requireActual('@console/internal/components/factory/modal'),
  ModalTitle: jest.fn(({ children }) => children),
  ModalBody: jest.fn(({ children }) => children),
  ModalSubmitFooter: jest.fn(({ submitText, submitDisabled }) => (
    <button type="submit" disabled={submitDisabled}>
      {submitText}
    </button>
  )),
  ModalWrapper: jest.fn(({ children }) => children),
}));

describe('SubscriptionChannelModal', () => {
  let subscriptionChannelModalProps: SubscriptionChannelModalProps;
  let k8sUpdate: jest.Mock;
  let close: jest.Mock;
  let cancel: jest.Mock;
  let subscription: SubscriptionKind;
  let pkg: PackageManifestKind;

  beforeEach(() => {
    jest.clearAllMocks();

    k8sUpdate = jest.fn().mockResolvedValue({});
    close = jest.fn();
    cancel = jest.fn();
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

    subscriptionChannelModalProps = {
      subscription,
      pkg,
      k8sUpdate,
      close,
      cancel,
    };
  });

  it('displays modal title and save button', () => {
    renderWithProviders(<SubscriptionChannelModal {...subscriptionChannelModalProps} />);

    expect(screen.getByText('Change Subscription update channel')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('displays radio button for each available channel', () => {
    renderWithProviders(<SubscriptionChannelModal {...subscriptionChannelModalProps} />);

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(pkg.status.channels.length);
    expect(screen.getByRole('radio', { name: /stable/i })).toBeVisible();
    expect(screen.getByRole('radio', { name: /nightly/i })).toBeVisible();
  });

  it('updates subscription when different channel is selected and form is submitted', async () => {
    renderWithProviders(<SubscriptionChannelModal {...subscriptionChannelModalProps} />);

    const nightlyRadio = screen.getByRole('radio', { name: /nightly/i });
    fireEvent.click(nightlyRadio);

    const form = screen.getByRole('button', { name: 'Save' }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(k8sUpdate).toHaveBeenCalledTimes(1);
    });

    expect(k8sUpdate).toHaveBeenCalledWith(
      SubscriptionModel,
      expect.objectContaining({
        spec: expect.objectContaining({
          channel: 'nightly',
        }),
      }),
    );
  });

  it('calls close callback after successful form submission', async () => {
    renderWithProviders(<SubscriptionChannelModal {...subscriptionChannelModalProps} />);

    const nightlyRadio = screen.getByRole('radio', { name: /nightly/i });
    fireEvent.click(nightlyRadio);

    const form = screen.getByRole('button', { name: 'Save' }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  it('disables submit button when no channel change is made', () => {
    renderWithProviders(<SubscriptionChannelModal {...subscriptionChannelModalProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
  });

  it('enables submit button when channel selection changes', () => {
    renderWithProviders(<SubscriptionChannelModal {...subscriptionChannelModalProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    const nightlyRadio = screen.getByRole('radio', { name: /nightly/i });
    fireEvent.click(nightlyRadio);

    expect(saveButton).not.toBeDisabled();
  });
});
