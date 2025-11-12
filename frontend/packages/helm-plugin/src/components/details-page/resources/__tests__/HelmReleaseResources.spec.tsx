import * as React from 'react';
import { screen } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockHelmReleases } from '../../../__tests__/helm-release-mock-data';
import HelmReleaseResources from '../HelmReleaseResources';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('HelmReleaseResources', () => {
  const helmReleaseResourcesProps: React.ComponentProps<typeof HelmReleaseResources> = {
    customData: mockHelmReleases[0],
  };

  it('should render the MultiListPage component', () => {
    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({ ns: 'test-helm' });
    renderWithProviders(<HelmReleaseResources {...helmReleaseResourcesProps} />);
    // MultiListPage typically renders a list/table of resources
    expect(screen.getByText('No Resources found')).toBeTruthy();
  });
});
