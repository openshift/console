import { Table } from '@console/internal/components/factory';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import ImageVulnerabilitiesTable from '../ImageVulnerabilitiesTable';

jest.mock('@console/internal/components/factory', () => ({
  Table: jest.fn(() => null),
}));

const mockTable = Table as jest.Mock;

describe('ImageVulnerabilitiesTable', () => {
  const vuln = fakeVulnFor(Priority.Critical);
  const props = {
    features: vuln.spec.features,
  };

  beforeEach(() => {
    mockTable.mockClear();
  });

  it('should render Table component', () => {
    renderWithProviders(<ImageVulnerabilitiesTable {...props} />);

    expect(mockTable).toHaveBeenCalledTimes(1);
  });

  it('should pass correct column headers to Table', () => {
    renderWithProviders(<ImageVulnerabilitiesTable {...props} />);

    const tableProps = mockTable.mock.calls[0][0];
    const headers = tableProps.Header({});

    const expectedHeaders = [
      'Name',
      'Severity',
      'Package',
      'Type',
      'Source',
      'Current version',
      'Fixed in version',
    ];

    expectedHeaders.forEach((expectedTitle, index) => {
      expect(headers[index].title).toBe(expectedTitle);
    });
  });
});
