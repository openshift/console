import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, useLocation } from 'react-router';
import type {
  CatalogItem,
  CatalogItemAttribute,
} from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
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

// Catalog URL utilities read window.location; keep it aligned with the test router.
const SyncBrowserLocation = () => {
  const location = useLocation();
  useEffect(() => {
    window.history.replaceState(null, '', `${location.pathname}${location.search}`);
  }, [location]);
  return null;
};

describe('CatalogController', () => {
  beforeEach(() => {
    useQueryParamsMock.mockImplementation(() => new URLSearchParams());
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, '', '/');
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
        { uid: 'olmv0', type: 'operator', name: 'Classic operator example' },
        { uid: 'olmv1', type: 'operator', name: 'Cluster extension example' },
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
        uid: 'olmv0',
        type: 'operator',
        name: 'Classic operator example',
        attributes: { operatorCatalog: 'Classic operators' },
      },
      {
        uid: 'olmv1',
        type: 'operator',
        name: 'Cluster extension example',
        attributes: { operatorCatalog: 'Cluster extensions' },
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
            filters: [
              {
                label: 'Catalog',
                attribute: 'operatorCatalog',
                filterType: 'radio',
                comparator: (a, b) => b.localeCompare(a),
              },
            ],
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

    expect(screen.getByText('Catalog')).toBeVisible();
    expect(screen.queryByText('Classic operator example')).not.toBeInTheDocument();
    expect(screen.getByText('Cluster extension example')).toBeVisible();
    expect(screen.getByRole('radio', { name: /Cluster extensions/ })).toBeChecked();
    expect(screen.getAllByRole('radio')[0]).toHaveAccessibleName(/Cluster extensions/);

    await user.click(screen.getByRole('radio', { name: /Classic/ }));
    expect(screen.getByText('Classic operator example')).toBeVisible();
    expect(screen.queryByText('Cluster extension example')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Cluster extensions/ }));
    expect(screen.queryByText('Classic operator example')).not.toBeInTheDocument();
    expect(screen.getByText('Cluster extension example')).toBeVisible();
    expect(screen.getByRole('radio', { name: /Classic/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /Cluster extensions/ })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: /Classic/ }));
    expect(screen.getByText('Classic operator example')).toBeVisible();
    expect(screen.queryByText('Cluster extension example')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Cluster extensions/ })).not.toBeChecked();

    await user.click(screen.getByRole('radio', { name: /Classic/ }));
    expect(screen.getByText('Classic operator example')).toBeVisible();
    expect(screen.queryByText('Cluster extension example')).not.toBeInTheDocument();
  });

  const renderFacetCatalog = (filters: ResolvedCodeRefProperties<CatalogItemAttribute>[]) => {
    useQueryParamsMock.mockImplementation(() => new URLSearchParams(useLocation().search));
    const items = [
      {
        uid: 'stable-a',
        type: 'example',
        name: 'Stable A',
        attributes: { channel: 'Stable', provider: 'A' },
      },
      {
        uid: 'preview-a',
        type: 'example',
        name: 'Preview A',
        attributes: { channel: 'Preview', provider: 'A' },
      },
      {
        uid: 'stable-b',
        type: 'example',
        name: 'Stable B',
        attributes: { channel: 'Stable', provider: 'B' },
      },
    ];
    const props: ComponentProps<typeof CatalogController> = {
      type: 'example',
      title: 'Example catalog',
      description: null,
      catalogExtensions: [
        {
          pluginName: '@console/test-plugin',
          properties: { type: 'example', title: 'Example catalog', filters },
          type: 'console.catalog/item-type',
          uid: 'example',
        },
      ],
      items,
      itemsMap: { example: items },
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };
    renderWithProviders(
      <>
        <SyncBrowserLocation />
        <Link to='?channel=["missing","Stable","Preview"]'>Load saved filters</Link>
        <Link to="?channel=[]">Load empty filters</Link>
        <Link to='?channel=["missing"]'>Load unavailable filters</Link>
        <Link to="?channel=invalid">Load invalid filters</Link>
        <CatalogController {...props} />
      </>,
    );
    return { user: userEvent.setup() };
  };

  it('should support radio facets on any catalog type without adding an All choice', async () => {
    const { user } = renderFacetCatalog([
      { label: 'Channel', attribute: 'channel', filterType: 'radio' },
    ]);

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.queryByRole('radio', { name: 'All' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Preview/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Stable/ })).not.toBeChecked();
    expect(screen.getByText('Preview A')).toBeVisible();
    expect(screen.queryByText('Stable A')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Preview/ }));
    expect(screen.getByText('Preview A')).toBeVisible();
    expect(screen.queryByText('Stable A')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Preview/ }));
    expect(screen.getByRole('radio', { name: /Preview/ })).toBeChecked();
    expect(screen.queryByText('Stable A')).not.toBeInTheDocument();

    await user.keyboard('[ArrowDown]');
    expect(screen.getByRole('radio', { name: /Stable/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Preview/ })).not.toBeChecked();
    expect(screen.getByText('Stable A')).toBeVisible();
    expect(screen.queryByText('Preview A')).not.toBeInTheDocument();
  });

  it.each([undefined, 'checkbox'] as const)(
    'should preserve multi-select behavior for %s facets',
    async (filterType) => {
      const { user } = renderFacetCatalog([{ label: 'Channel', attribute: 'channel', filterType }]);
      await user.click(screen.getByRole('checkbox', { name: /Preview/ }));
      expect(screen.queryByText('Stable A')).not.toBeInTheDocument();
      await user.click(screen.getByRole('checkbox', { name: /Stable/ }));
      expect(screen.getByText('Stable A')).toBeVisible();
      expect(screen.getByText('Preview A')).toBeVisible();
      await user.click(screen.getByRole('checkbox', { name: /Preview/ }));
      expect(screen.queryByText('Preview A')).not.toBeInTheDocument();
      expect(screen.getByText('Stable A')).toBeVisible();
    },
  );

  it('should prefer the first available saved value over the default', async () => {
    const { user } = renderFacetCatalog([
      { label: 'Channel', attribute: 'channel', filterType: 'radio' },
    ]);
    await user.click(screen.getByRole('link', { name: 'Load saved filters' }));
    expect(screen.getByRole('radio', { name: /Stable/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Preview/ })).not.toBeChecked();
    expect(screen.getByText('Stable A')).toBeVisible();
    expect(screen.queryByText('Preview A')).not.toBeInTheDocument();
  });

  it('should use the first displayed option as the default with a custom comparator', () => {
    renderFacetCatalog([
      {
        label: 'Channel',
        attribute: 'channel',
        filterType: 'radio',
        comparator: (a, b) => b.localeCompare(a),
      },
    ]);
    expect(screen.getAllByRole('radio')[0]).toHaveAccessibleName(/Stable/);
    expect(screen.getByRole('radio', { name: /Stable/ })).toBeChecked();
    expect(screen.getByText('Stable A')).toBeVisible();
    expect(screen.queryByText('Preview A')).not.toBeInTheDocument();
  });

  it.each(['empty', 'unavailable', 'invalid'])(
    'should default radio facets with %s URL selections',
    async (selection) => {
      const { user } = renderFacetCatalog([
        { label: 'Channel', attribute: 'channel', filterType: 'radio' },
      ]);
      await user.click(screen.getByRole('radio', { name: /Stable/ }));
      await user.click(screen.getByRole('link', { name: `Load ${selection} filters` }));
      expect(screen.getByRole('radio', { name: /Preview/ })).toBeChecked();
      expect(screen.getByText('Preview A')).toBeVisible();
      expect(screen.queryByText('Stable A')).not.toBeInTheDocument();
    },
  );

  it('should keep radio selections independent across facets', async () => {
    const { user } = renderFacetCatalog([
      { label: 'Channel', attribute: 'channel', filterType: 'radio' },
      { label: 'Provider', attribute: 'provider', filterType: 'radio' },
    ]);
    await user.click(screen.getByRole('radio', { name: /Stable/ }));
    await user.click(screen.getByRole('radio', { name: /^B / }));
    expect(screen.getByRole('radio', { name: /Stable/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^B / })).toBeChecked();
    expect(screen.getByText('Stable B')).toBeVisible();
    expect(screen.queryByText('Stable A')).not.toBeInTheDocument();
  });
});
