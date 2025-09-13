import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PullSecret } from '../namespace';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'; // Adjust path
import { testNamespace } from '../../../__mocks__/k8sResourcesMocks';
import { ServiceAccountModel } from '../../models';

describe('PullSecret', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays a loading state initially, then shows the button after loading', async () => {
    const mockK8sGet = jest
      .spyOn(k8sResourceModule, 'k8sGet')
      .mockResolvedValue({ imagePullSecrets: [] });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    const button = await screen.findByRole('button', { name: /not configured/i });
    expect(button).toBeInTheDocument();
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

    const button = await screen.findByRole('button', { name: /not configured/i });
    expect(button).toBeInTheDocument();
  });
});
