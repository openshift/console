import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import * as ReactRouter from 'react-router';
import * as k8sWatchHook from '@console/internal/components/utils/k8s-watch-hook';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockHelmReleases } from '../../../__tests__/helm-release-mock-data';
import HelmReleaseResources from '../HelmReleaseResources';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(() => ({})),
  useK8sWatchResource: jest.fn(() => [null, true, null]),
}));

const mockUseK8sWatchResources = k8sWatchHook.useK8sWatchResources as jest.Mock;

describe('HelmReleaseResources', () => {
  const helmReleaseResourcesProps: ComponentProps<typeof HelmReleaseResources> = {
    customData: mockHelmReleases[0],
  };

  it('should render the MultiListPage component and display empty state when no resources exist', () => {
    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({ ns: 'test-helm' });

    // mockHelmReleases[0] has an empty manifest, so no resources to watch
    renderWithProviders(<HelmReleaseResources {...helmReleaseResourcesProps} />);

    // Verify useK8sWatchResources hook was called
    expect(mockUseK8sWatchResources).toHaveBeenCalled();

    // Verify empty state message is displayed (user-visible content)
    expect(screen.getByText('No Resources found')).toBeVisible();
  });
});
