import { Children, cloneElement } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Base64 } from 'js-base64';
import { Firehose } from '@console/internal/components/utils/firehose';
import { SecretModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { SecretsDetailsPage } from '../secret';

jest.mock('../utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(() => [null, true, null]),
}));

jest.mock('../utils/firehose', () => ({
  Firehose: jest.fn(),
}));

jest.mock('../utils/details-page', () => ({
  ...jest.requireActual('../utils/details-page'),
  ResourceSummary: jest.fn(() => null),
}));

jest.mock('../utils/headings', () => ({
  ...jest.requireActual('../utils/headings'),
  ConnectedPageHeading: jest.fn(() => null),
}));

const secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: { name: 'test-secret', namespace: 'default', resourceVersion: '1' },
  type: 'Opaque',
  data: { password: Base64.encode('original-password') },
};

const props = {
  name: secret.metadata.name,
  namespace: secret.metadata.namespace,
  kind: 'Secret',
  kindObj: SecretModel,
};

const mockFirehose = Firehose;
let watchedSecret;

describe('SecretsDetailsPage', () => {
  beforeEach(() => {
    watchedSecret = secret;
    mockFirehose.mockImplementation(({ children }) =>
      Children.map(children, (child) =>
        cloneElement(child, {
          obj: { data: watchedSecret, loaded: true, loadError: undefined },
          loaded: true,
        }),
      ),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('keeps values revealed across page rerenders and resource updates until hidden', () => {
    const { rerender } = renderWithProviders(<SecretsDetailsPage {...props} />);

    expect(screen.queryByText('original-password')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Reveal values' }));
    expect(screen.getByText('original-password')).toBeVisible();

    rerender(<SecretsDetailsPage {...props} />);
    expect(screen.getByRole('button', { name: 'Hide values' })).toBeVisible();
    expect(screen.getByText('original-password')).toBeVisible();

    const updatedSecret = {
      ...secret,
      metadata: { ...secret.metadata, resourceVersion: '2' },
      data: { password: Base64.encode('updated-password') },
    };
    watchedSecret = updatedSecret;
    rerender(<SecretsDetailsPage {...props} />);
    expect(screen.getByText('updated-password')).toBeVisible();

    userEvent.click(screen.getByRole('button', { name: 'Hide values' }));
    expect(screen.queryByText('updated-password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reveal values' })).toBeVisible();
  });
});
