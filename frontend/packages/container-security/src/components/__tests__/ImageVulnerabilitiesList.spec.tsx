import { MultiListPage } from '@console/internal/components/factory';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import ImageVulnerabilitiesList from '../ImageVulnerabilitiesList';

jest.mock('@console/internal/components/factory', () => ({
  MultiListPage: jest.fn(() => null),
}));

const mockMultiListPage = MultiListPage as jest.Mock;

describe('ImageVulnerabilitiesList', () => {
  const vuln = fakeVulnFor(Priority.Critical);
  const props = {
    obj: vuln,
  };

  beforeEach(() => {
    mockMultiListPage.mockClear();
  });

  it('should render MultiListPage', () => {
    renderWithProviders(<ImageVulnerabilitiesList {...props} />);

    expect(mockMultiListPage).toHaveBeenCalledTimes(1);
  });

  it('should pass Type and Severity row filters to MultiListPage', () => {
    renderWithProviders(<ImageVulnerabilitiesList {...props} />);

    const multiListPageProps = mockMultiListPage.mock.calls[0][0];
    expect(multiListPageProps.rowFilters).toHaveLength(2);
    expect(multiListPageProps.rowFilters[0].filterGroupName).toBe('Type');
    expect(multiListPageProps.rowFilters[1].filterGroupName).toBe('Severity');
  });
});
