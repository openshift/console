import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import * as UseQueryParams from '@console/shared/src/hooks/useQueryParams';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import CatalogController from '../CatalogController';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({
    pathname: '/test-path',
    search: '',
    hash: '',
    state: null,
  }),
}));

describe('CatalogController', () => {
  let spyUseQueryParams: jest.SpyInstance;

  beforeEach(() => {
    spyUseQueryParams = jest.spyOn(UseQueryParams, 'useQueryParams');
    spyUseQueryParams.mockImplementation(() => new URLSearchParams());
  });

  afterEach(() => {
    spyUseQueryParams.mockRestore();
  });

  it('should render the title and description from the catalog extension', async () => {
    const catalogControllerProps: React.ComponentProps<typeof CatalogController> = {
      type: 'HelmChart',
      title: null,
      description: null,
      catalogExtensions: [
        {
          pluginID: '@console/helm-plugin',
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
    const catalogControllerProps: React.ComponentProps<typeof CatalogController> = {
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
});
