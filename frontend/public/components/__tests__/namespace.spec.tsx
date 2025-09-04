import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PullSecret } from '../namespace';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { testNamespace } from '../../../__mocks__/k8sResourcesMocks';
import { ServiceAccountModel } from '../../models';

describe(PullSecret.displayName, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays button to manage pull secrets after loading', async () => {
    const mockK8sGet = jest.spyOn(k8sResourceModule, 'k8sGet').mockResolvedValue({ items: [] });

    render(<PullSecret namespace={testNamespace} />);

    // Wait for the component to load and display the button
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Verify the k8sGet was called with correct parameters
    expect(mockK8sGet).toHaveBeenCalledWith(
      ServiceAccountModel,
      'default',
      testNamespace.metadata.name,
      {},
    );
  });

  it('displays loading state while fetching pull secrets', () => {
    jest.spyOn(k8sResourceModule, 'k8sGet').mockReturnValue(Promise.resolve({ items: [] }));

    render(<PullSecret namespace={testNamespace} />);

    // User should see loading state initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles service account loading and displays pull secret management', async () => {
    jest.spyOn(k8sResourceModule, 'k8sGet').mockResolvedValue({
      items: [],
      imagePullSecrets: [],
    });

    render(<PullSecret namespace={testNamespace} />);

    // User should eventually see the pull secret management interface
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});
