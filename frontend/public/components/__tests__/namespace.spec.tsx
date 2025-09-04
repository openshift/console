import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PullSecret } from '../namespace';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'; // Adjust path
import { testNamespace } from '../../../__mocks__/k8sResourcesMocks';
import { ServiceAccountModel } from '../../models';

describe('PullSecret', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies loading state initially, then shows configuration button after data loads', async () => {
    const mockK8sGet = jest
      .spyOn(k8sResourceModule, 'k8sGet')
      .mockResolvedValue({ imagePullSecrets: [] });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    expect(screen.getByRole('progressbar', { name: /contents/i })).toBeVisible();

    const button = await screen.findByRole('button', { name: /not configured/i });
    expect(button).toBeVisible();

    // Verify API was called correctly
    expect(mockK8sGet).toHaveBeenCalledWith(
      ServiceAccountModel,
      'default',
      testNamespace.metadata.name,
      {},
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles service account loading and displays the pull secret management interface', async () => {
    jest.spyOn(k8sResourceModule, 'k8sGet').mockResolvedValue({
      imagePullSecrets: [],
    });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    const button = await screen.findByRole('button', { name: 'Not configured' });
    expect(button).toBeVisible();
  });
});
