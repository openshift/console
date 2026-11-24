import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Base64 } from 'js-base64';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s/types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { SecretsDetailsPage } from '../secret';

jest.mock('../utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
  useK8sWatchResource: jest.fn(() => [null, true, null]),
}));

jest.mock('../utils/details-page', () => ({
  ...jest.requireActual('../utils/details-page'),
  ResourceSummary: jest.fn(() => null),
}));

const secret: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: { name: 'test-secret', namespace: 'default', resourceVersion: '1' },
  type: 'Opaque',
  data: { password: Base64.encode('original-password') },
};

const props = {
  name: secret.metadata.name,
  namespace: secret.metadata.namespace,
  kindObj: SecretModel,
};

describe('SecretsDetailsPage', () => {
  beforeEach(() => {
    jest.mocked(useK8sWatchResources).mockReturnValue({
      obj: { data: secret, loaded: true, loadError: undefined },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('keeps values revealed across page rerenders and resource updates until hidden', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<SecretsDetailsPage {...props} />);

    expect(screen.queryByText('original-password')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reveal values' }));
    expect(screen.getByText('original-password')).toBeVisible();

    rerender(<SecretsDetailsPage {...props} />);
    expect(screen.getByRole('button', { name: 'Hide values' })).toBeVisible();
    expect(screen.getByText('original-password')).toBeVisible();

    const updatedSecret: SecretKind = {
      ...secret,
      metadata: { ...secret.metadata, resourceVersion: '2' },
      data: { password: Base64.encode('updated-password') },
    };
    jest.mocked(useK8sWatchResources).mockReturnValue({
      obj: { data: updatedSecret, loaded: true, loadError: undefined },
    });
    rerender(<SecretsDetailsPage {...props} />);
    expect(screen.getByText('updated-password')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Hide values' }));
    expect(screen.queryByText('updated-password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reveal values' })).toBeVisible();
  });
});
