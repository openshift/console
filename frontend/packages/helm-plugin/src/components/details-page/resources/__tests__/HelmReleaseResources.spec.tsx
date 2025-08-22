import * as React from 'react';
import { screen, configure } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockHelmReleases } from '../../../__tests__/helm-release-mock-data';
import HelmReleaseResources from '../HelmReleaseResources';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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
    expect(screen.getByText('No resources found')).toBeTruthy();
  });
});
