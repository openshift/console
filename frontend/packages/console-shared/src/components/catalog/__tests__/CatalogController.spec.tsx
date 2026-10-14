import type { ComponentProps } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import * as UseQueryParams from '@console/shared/src/hooks/useQueryParams';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { CatalogController } from '../CatalogController';

// jsdom has no layout dimensions for the virtualized grid.
jest.mock('../../virtualized-grid/VirtualizedGrid', () => ({
  VirtualizedGrid: ({
    items,
    renderCell,
  }: {
    items: CatalogItem[];
    renderCell: (item: CatalogItem) => React.ReactNode;
  }) => items.map(renderCell),
}));

jest.mock('@console/shared/src/hooks/useQueryParams', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useQueryParams'),
  useQueryParams: jest.fn(),
}));

const useQueryParamsMock = UseQueryParams.useQueryParams as jest.Mock;

describe('CatalogController', () => {
  beforeEach(() => {
    useQueryParamsMock.mockImplementation(() => new URLSearchParams());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the title and description from the catalog extension', async () => {
    const catalogControllerProps: ComponentProps<typeof CatalogController> = {
      type: 'HelmChart',
      title: null,
      description: null,
      catalogExtensions: [
        {
          pluginName: '@console/helm-plugin',
          properties: {
            catalogDescription: 'Helm Catalog description',
            title: 'Helm Charts',
            type: 'HelmChart',
          },
          type: 'console.catalog/item-type',
          uid: '@console/helm-plugin[9]',
        },
      ],
      items: [],
      itemsMap: { HelmChart: [] },
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };

    renderWithProviders(<CatalogController {...catalogControllerProps} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Helm Charts' })).toBeVisible();
    });
    expect(screen.getByText('Helm Catalog description')).toBeVisible();
  });

  it('should fall back to the default title and description if the extension is missing them', async () => {
    const catalogControllerProps: ComponentProps<typeof CatalogController> = {
      type: 'HelmChart',
      title: 'Default title',
      description: 'Default description',
      catalogExtensions: [],
      items: [],
      itemsMap: { HelmChart: [] },
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };

    renderWithProviders(<CatalogController {...catalogControllerProps} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Default title' })).toBeVisible();
    });
    expect(screen.getByText('Default description')).toBeVisible();
  });

  it('should combine both operator generations in one landing-page type', async () => {
    const props: ComponentProps<typeof CatalogController> = {
      type: '',
      title: 'Software Catalog',
      description: null,
      catalogExtensions: [
        {
          pluginName: '@console/test-plugin',
          properties: { type: 'operator', title: 'Operators' },
          type: 'console.catalog/item-type',
          uid: 'operators',
        },
        {
          pluginName: '@console/test-plugin',
          properties: { type: 'HelmChart', title: 'Helm Charts' },
          type: 'console.catalog/item-type',
          uid: 'helm',
        },
      ],
      items: [
        { uid: 'classic', type: 'operator', name: 'Classic example' },
        { uid: 'next-gen', type: 'operator', name: 'Next-Gen example' },
        { uid: 'helm', type: 'HelmChart', name: 'Example chart' },
      ],
      itemsMap: {},
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };

    renderWithProviders(<CatalogController {...props} />);

    const typeLinks = await screen.findAllByRole('link');
    expect(typeLinks.map((link) => link.textContent)).toEqual(['Helm Charts (1)', 'Operators (2)']);
  });

  it('should filter the shared operator catalog by lifecycle version', async () => {
    function useRouterQueryParams() {
      return new URLSearchParams(useLocation().search);
    }
    useQueryParamsMock.mockImplementation(useRouterQueryParams);
    const user = userEvent.setup();
    const items = [
      {
        uid: 'classic',
        type: 'operator',
        name: 'Classic example',
        attributes: { olmGeneration: 'Classic' },
      },
      {
        uid: 'next-gen',
        type: 'operator',
        name: 'Next-Gen example',
        attributes: { olmGeneration: 'Next-Gen' },
      },
    ];
    const props: ComponentProps<typeof CatalogController> = {
      type: 'operator',
      title: 'Operators',
      description: null,
      catalogExtensions: [
        {
          pluginName: '@console/test-plugin',
          properties: {
            type: 'operator',
            title: 'Operators',
            filters: [{ label: 'Lifecycle version', attribute: 'olmGeneration' }],
          },
          type: 'console.catalog/item-type',
          uid: 'operators',
        },
      ],
      items,
      itemsMap: { operator: items },
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };

    renderWithProviders(<CatalogController {...props} />);

    expect(screen.getByText('Lifecycle version')).toBeVisible();
    expect(screen.getByText('Classic example')).toBeVisible();
    expect(screen.getByText('Next-Gen example')).toBeVisible();

    await user.click(screen.getByRole('checkbox', { name: /Classic/ }));
    expect(screen.getByText('Classic example')).toBeVisible();
    expect(screen.queryByText('Next-Gen example')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /Next-Gen/ }));
    expect(screen.getByText('Classic example')).toBeVisible();
    expect(screen.getByText('Next-Gen example')).toBeVisible();

    await user.click(screen.getByRole('checkbox', { name: /Classic/ }));
    expect(screen.queryByText('Classic example')).not.toBeInTheDocument();
    expect(screen.getByText('Next-Gen example')).toBeVisible();

    await user.click(screen.getByRole('checkbox', { name: /Next-Gen/ }));
    expect(screen.getByText('Classic example')).toBeVisible();
    expect(screen.getByText('Next-Gen example')).toBeVisible();
  });
});
