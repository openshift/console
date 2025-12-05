import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmResourcesList from '../HelmReleaseResourcesList';
import { helmReleaseResourceData } from './helm-release-resource.data';

describe('HelmResourcesList', () => {
  beforeEach(() => {
    renderWithProviders(
      <HelmResourcesList
        aria-label="Resources"
        loaded
        data={helmReleaseResourceData}
        data-test="helm-resources-list"
        Header={() => null}
      />,
    );
  });

  it('should render the ConsoleDataView component', () => {
    // Check that the ConsoleDataView is rendered by looking for the data view table
    expect(screen.getByTestId('data-view-table')).toBeTruthy();
  });

  it('should render the proper Headers in the Resources tab', () => {
    const expectedHelmResourcesHeader: string[] = ['Name', 'Type', 'Status', 'Created'];

    // Check that all expected headers are rendered (use getAllByText to handle multiple matches)
    expectedHelmResourcesHeader.forEach((header) => {
      expect(screen.getAllByText(header).length).toBeGreaterThan(0);
    });
  });

  it('should render resource data correctly', () => {
    // Check that the resource name is rendered
    expect(screen.getByText('dotnet')).toBeTruthy();

    // Check that the resource kind is rendered (use getAllByText to handle multiple matches)
    expect(screen.getAllByText('BuildConfig').length).toBeGreaterThan(0);
  });
});
