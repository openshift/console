import { screen } from '@testing-library/react';
import { createUserSettingsStore } from '@console/app/src/providers/user-preferences/UserPreferenceContext';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ConsoleDataView } from '../ConsoleDataView';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

type Item = { metadata: { name: string } };

// Stable reference: `useResolvedExtensions` is consumed through memoized hooks.
const noExtensions: [unknown[], boolean, unknown[]] = [[], true, []];

const NoDataEmptyMsg = () => <span>ConsoleDataView reproducer empty state</span>;

const columns: ConsoleDataViewColumn<Item>[] = [{ id: 'name', type: 'name', title: 'Name' }];

const getDataViewRows: GetDataViewRows<Item> = (rows, activeColumns) =>
  rows.map(({ obj }) =>
    activeColumns.map(({ id }) => ({
      id,
      cell: id === 'name' ? obj.metadata.name : null,
    })),
  );

const renderDataView = (data: Item[]) => {
  (useResolvedExtensions as jest.Mock).mockImplementation(() => noExtensions);

  return renderWithProviders(
    <OverlayProvider>
      <ConsoleDataView<Item>
        id="core~v1~Pod"
        label="items"
        data={data}
        loaded
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideNameLabelFilters
        isResizable={false}
        NoDataEmptyMsg={NoDataEmptyMsg}
      />
    </OverlayProvider>,
    { userSettingsStore: createUserSettingsStore() },
  );
};

describe('ConsoleDataView NoDataEmptyMsg', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: originalIntersectionObserver,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('renders NoDataEmptyMsg instead of the generic empty state when there is no data', () => {
    renderDataView([]);

    expect(screen.getByText('ConsoleDataView reproducer empty state')).toBeVisible();
    // The generic StatusBox fallback must not win over the consumer-provided component.
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders the table instead of NoDataEmptyMsg when data is present', () => {
    renderDataView([{ metadata: { name: 'alpha' } }]);

    expect(screen.queryByText('ConsoleDataView reproducer empty state')).not.toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'items table' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'alpha' })).toBeVisible();
  });
});
