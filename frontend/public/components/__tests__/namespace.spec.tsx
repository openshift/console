import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PullSecret } from '../namespace';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { testNamespace } from '../../../__mocks__/k8sResourcesMocks';
import { ServiceAccountModel } from '../../models';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sGet: jest.fn(),
}));

const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;

describe('PullSecret', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('verifies loading state initially, then shows configuration button after data loads', async () => {
    k8sGetMock.mockResolvedValue({ imagePullSecrets: [] });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    expect(screen.getByRole('progressbar', { name: /contents/i })).toBeVisible();

    const button = await screen.findByRole('button', { name: /not configured/i });
    expect(button).toBeVisible();

    // Verify API was called correctly
    expect(k8sGetMock).toHaveBeenCalledWith(
      ServiceAccountModel,
      'default',
      testNamespace.metadata.name,
      {},
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles service account loading and displays the pull secret management interface', async () => {
    k8sGetMock.mockResolvedValue({
      imagePullSecrets: [],
    });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    const button = await screen.findByRole('button', { name: 'Not configured' });
    expect(button).toBeVisible();
  });
});
