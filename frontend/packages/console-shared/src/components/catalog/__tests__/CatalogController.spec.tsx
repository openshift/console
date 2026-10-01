import type { ComponentProps } from 'react';
import { screen, waitFor } from '@testing-library/react';
import * as UseQueryParams from '@console/shared/src/hooks/useQueryParams';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { CatalogController } from '../CatalogController';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: () => ({
    pathname: '/test-path',
    search: '',
    hash: '',
    state: null,
  }),
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

  it('should sort types by weight and then alphabetically', async () => {
    const itemType = (type: string, title: string, sortWeight?: number) => ({
      pluginName: '@console/test-plugin',
      properties: { type, title, ...(sortWeight ? { sortWeight } : {}) },
      type: 'console.catalog/item-type' as const,
      uid: `@console/test-plugin[${type}]`,
    });
    const item = (type: string) => ({ uid: `${type}-1`, type, name: type });

    const catalogControllerProps: ComponentProps<typeof CatalogController> = {
      type: '',
      title: 'Software Catalog',
      description: null,
      catalogExtensions: [
        itemType('operator-olmv0', 'Classic Operators', 1),
        itemType('operator-olmv1', 'Next-Gen Operators'),
        itemType('HelmChart', 'Helm Charts'),
      ],
      items: [item('operator-olmv0'), item('operator-olmv1'), item('HelmChart')],
      itemsMap: {},
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };

    renderWithProviders(<CatalogController {...catalogControllerProps} />);

    const typeLinks = await screen.findAllByRole('link');
    expect(typeLinks.map((link) => link.textContent)).toEqual([
      'Helm Charts (1)',
      'Next-Gen Operators (1)',
      'Classic Operators (1)',
    ]);
  });
});
