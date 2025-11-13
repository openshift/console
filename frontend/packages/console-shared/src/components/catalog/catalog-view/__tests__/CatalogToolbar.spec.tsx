import { render } from '@testing-library/react';
import { CatalogSortOrder } from '../../utils/types';
import CatalogToolbar from '../CatalogToolbar';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  withTranslation: () => (Component: any) => Component,
}));

jest.mock('@console/internal/components/utils/console-select', () => ({
  ConsoleSelect: jest.fn(() => null),
}));

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  useDebounceCallback: (fn: any) => fn,
  useFlag: () => false,
}));

describe('CatalogToolbar', () => {
  const defaultProps = {
    title: 'Test Catalog',
    totalItems: 10,
    searchKeyword: '',
    sortOrder: CatalogSortOrder.ASC,
    groupings: {},
    activeGrouping: '',
    onGroupingChange: jest.fn(),
    onSearchKeywordChange: jest.fn(),
    onSortOrderChange: jest.fn(),
  };

  it('should render toolbar', () => {
    const { getByText } = render(<CatalogToolbar {...defaultProps} />);
    getByText('Test Catalog');
    getByText('console-shared~{{totalItems}} items');
  });
});
