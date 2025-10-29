import { render } from '@testing-library/react';
import { CatalogToolbarItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
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
}));

const mockToolbarComponent = () => <div data-test="mock-toolbar-item">Mock Toolbar Item</div>;

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

  it('should render toolbar without toolbar extensions', () => {
    const { getByText } = render(<CatalogToolbar {...defaultProps} />);
    getByText('Test Catalog');
    getByText('console-shared~{{totalItems}} items');
  });

  it('should render toolbar items when toolbarExtensions are provided', () => {
    const toolbarExtensions: ResolvedExtension<CatalogToolbarItem>[] = [
      {
        type: 'console.catalog/toolbar-item',
        properties: {
          component: mockToolbarComponent,
        },
        pluginID: 'test-plugin',
        pluginName: 'test-plugin',
        uid: 'test-toolbar-item-1',
      },
    ];

    const { getByTestId } = render(
      <CatalogToolbar {...defaultProps} toolbarExtensions={toolbarExtensions} />,
    );
    getByTestId('mock-toolbar-item');
  });

  it('should render multiple toolbar items', () => {
    const toolbarExtensions: ResolvedExtension<CatalogToolbarItem>[] = [
      {
        type: 'console.catalog/toolbar-item',
        properties: {
          component: () => <div data-test="toolbar-item-1">Item 1</div>,
        },
        pluginID: 'test-plugin',
        pluginName: 'test-plugin',
        uid: 'test-toolbar-item-1',
      },
      {
        type: 'console.catalog/toolbar-item',
        properties: {
          component: () => <div data-test="toolbar-item-2">Item 2</div>,
        },
        pluginID: 'test-plugin',
        pluginName: 'test-plugin',
        uid: 'test-toolbar-item-2',
      },
    ];

    const { getByTestId } = render(
      <CatalogToolbar {...defaultProps} toolbarExtensions={toolbarExtensions} />,
    );
    getByTestId('toolbar-item-1');
    getByTestId('toolbar-item-2');
  });

  it('should render each toolbar extension with unique uid as key', () => {
    const toolbarExtensions: ResolvedExtension<CatalogToolbarItem>[] = [
      {
        type: 'console.catalog/toolbar-item',
        properties: {
          component: () => <div data-test="item-1">Unique Item</div>,
        },
        pluginID: 'test-plugin',
        pluginName: 'test-plugin',
        uid: 'unique-toolbar-item-id',
      },
    ];

    const { getByTestId } = render(
      <CatalogToolbar {...defaultProps} toolbarExtensions={toolbarExtensions} />,
    );

    // Verify the toolbar item component is rendered
    getByTestId('item-1');
  });

  it('should not render toolbar items when toolbarExtensions is undefined', () => {
    const { queryByTestId } = render(
      <CatalogToolbar {...defaultProps} toolbarExtensions={undefined} />,
    );
    expect(queryByTestId('mock-toolbar-item')).toBeNull();
  });

  it('should not render toolbar items when toolbarExtensions is empty array', () => {
    const { queryByTestId } = render(<CatalogToolbar {...defaultProps} toolbarExtensions={[]} />);
    expect(queryByTestId('mock-toolbar-item')).toBeNull();
  });
});
