import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { t } from '../../../../../../../__mocks__/i18next';
import HelmReleaseResourcesHeader from '../HelmReleaseResourcesHeader';
import HelmResourcesList from '../HelmReleaseResourcesList';
import HelmReleaseResourcesRow from '../HelmReleaseResourcesRow';
import { helmReleaseResourceData } from './helm-release-resource.data';

describe('HelmResourcesList', () => {
  beforeEach(() => {
    renderWithProviders(
      <HelmResourcesList
        Header={HelmReleaseResourcesHeader(t)}
        Row={HelmReleaseResourcesRow}
        aria-label="Resources"
        loaded
        data={helmReleaseResourceData}
        data-test="helm-resources-list"
      />,
    );
  });

  it('should render the Table component', () => {
    // Check that the table is rendered with proper aria-label
    expect(screen.getByTestId('helm-resources-list')).toBeTruthy();
    expect(screen.getByRole('grid', { name: /Resources/i })).toBeTruthy();
  });

  it('should render the proper Headers in the Resources tab', () => {
    const expectedHelmResourcesHeader: string[] = ['Name', 'Type', 'Status', 'Created'];

    // Check that all expected headers are rendered
    expectedHelmResourcesHeader.forEach((header) => {
      expect(screen.getByText(header)).toBeTruthy();
    });
  });
});
