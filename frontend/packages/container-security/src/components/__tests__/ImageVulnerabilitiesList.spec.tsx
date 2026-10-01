import { MultiListPage } from '@console/internal/components/factory/list-page';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { Priority } from '../../const';
import type { ImageManifestVuln, ImageVuln } from '../../types';
import ImageVulnerabilitiesList from '../ImageVulnerabilitiesList';
import { fakeVulnFor } from './bad-pods';

jest.mock('@console/internal/components/factory/list-page', () => ({
  MultiListPage: jest.fn(() => null),
}));

const mockMultiListPage = MultiListPage as unknown as jest.Mock;

describe('ImageVulnerabilitiesList', () => {
  const vuln = fakeVulnFor(Priority.Critical);
  const props = { obj: vuln };

  beforeEach(() => {
    mockMultiListPage.mockClear();
  });

  const getFlatten = () => mockMultiListPage.mock.calls[0][0].flatten;

  it('should render MultiListPage without the legacy filter toolbar', () => {
    renderWithProviders(<ImageVulnerabilitiesList {...props} />);

    expect(mockMultiListPage).toHaveBeenCalledTimes(1);
    expect(mockMultiListPage.mock.calls[0][0].omitFilterToolbar).toBe(true);
  });

  it('should pair every vulnerability with the package it affects', () => {
    renderWithProviders(<ImageVulnerabilitiesList {...props} />);

    const flattened: ImageVuln[] = getFlatten()({ imageVulnerabilities: { data: vuln } });

    expect(
      flattened.map(({ feature, vulnerability }) => `${feature.name}/${vulnerability.name}`),
    ).toEqual(['libcurl/RHSA-2019:1880', 'libssh2/RHSA-2019:1884', 'libssh2/RHSA-2019:2136']);
  });

  it('should produce no rows when the vulnerability report is unavailable', () => {
    renderWithProviders(<ImageVulnerabilitiesList {...props} />);

    expect(getFlatten()({})).toEqual([]);
    expect(getFlatten()({ imageVulnerabilities: { data: {} as ImageManifestVuln } })).toEqual([]);
  });
});
