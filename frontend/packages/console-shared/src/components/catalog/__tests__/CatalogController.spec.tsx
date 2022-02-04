import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading } from '@console/internal/components/utils';
import * as UseQueryParams from '@console/shared/src/hooks/useQueryParams';
import CatalogController from '../CatalogController';

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom');
  return {
    ...reactRouterDom,
    useLocation: () => {
      return 'path';
    },
  };
});

jest.mock('react', () => {
  const react = jest.requireActual('react');
  return {
    ...react,
    useMemo: jest.fn(),
  };
});

describe('Catalog Controller', () => {
  const spyUseMemo = jest.spyOn(React, 'useMemo');
  const spyUseQueryParams = jest.spyOn(UseQueryParams, 'useQueryParams');
  it('should return proper catalog title and description', () => {
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
      itemsMap: null,
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };
    spyUseQueryParams.mockImplementation(() => ({
      category: null,
      keyword: null,
      sortOrder: null,
      append: null,
      delete: null,
      get: null,
      getAll: null,
      has: null,
      set: null,
      sort: null,
      forEach: null,
      entries: null,
      keys: null,
      values: null,
      [Symbol.iterator]: null,
    }));
    spyUseMemo.mockReturnValue({
      pluginID: '@console/helm-plugin',
      pluginName: '@console/helm-plugin',
      properties: {
        catalogDescription: 'Helm Catalog description',
        title: 'Helm Charts',
        type: 'HelmChart',
      },
      type: 'console.catalog/item-type',
      uid: '@console/helm-plugin[9]',
    });

    const catalogController = shallow(<CatalogController {...catalogControllerProps} />);

    expect(catalogController.find(PageHeading).props().title).toEqual('Helm Charts');
    expect(catalogController.find('[data-test-id="catalog-page-description"]').text()).toEqual(
      'Helm Catalog description',
    );
  });

  it('should return proper catalog title and description when the description returns a JSX element', () => {
    const description = () => <p>My Catalog description</p>;
    const catalogControllerProps: React.ComponentProps<typeof CatalogController> = {
      type: 'CatalogItems',
      title: null,
      description: null,
      catalogExtensions: [
        {
          pluginID: 'pluginId',
          pluginName: 'pluginName',
          properties: {
            catalogDescription: description,
            title: 'Catalog items',
            type: 'CatalogItems',
          },
          type: 'console.catalog/item-type',
          uid: '@console/plugin[9]',
        },
      ],
      items: [],
      itemsMap: null,
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };
    spyUseQueryParams.mockImplementation(() => ({
      category: null,
      keyword: null,
      sortOrder: null,
      append: null,
      delete: null,
      get: null,
      getAll: null,
      has: null,
      set: null,
      sort: null,
      forEach: null,
      entries: null,
      keys: null,
      values: null,
      [Symbol.iterator]: null,
    }));
    spyUseMemo.mockReturnValue({
      pluginID: 'pluginId',
      pluginName: 'pluginName',
      properties: {
        catalogDescription: description,
        title: 'Catalog items',
        type: 'CatalogItems',
      },
      type: 'console.catalog/item-type',
      uid: '@console/plugin[9]',
    });

    const catalogController = shallow(<CatalogController {...catalogControllerProps} />);

    expect(catalogController.find(PageHeading).props().title).toEqual('Catalog items');
    expect(catalogController.find('[data-test-id="catalog-page-description"]').text()).toEqual(
      'My Catalog description',
    );
  });

  it('should return proper catalog title and description when the extension does not have title and description', () => {
    const catalogControllerProps: React.ComponentProps<typeof CatalogController> = {
      type: 'HelmChart',
      title: 'Default title',
      description: 'Default description',
      catalogExtensions: [
        {
          pluginID: '@console/helm-plugin',
          pluginName: '@console/helm-plugin',
          properties: {
            catalogDescription: null,
            title: null,
            type: 'HelmChart',
          },
          type: 'console.catalog/item-type',
          uid: '@console/helm-plugin[9]',
        },
      ],
      items: [],
      itemsMap: null,
      loaded: true,
      loadError: null,
      searchCatalog: jest.fn(),
    };
    spyUseQueryParams.mockImplementation(() => ({
      catagory: null,
      keyword: null,
      sortOrder: null,
      append: null,
      delete: null,
      get: null,
      getAll: null,
      has: null,
      set: null,
      sort: null,
      forEach: null,
      entries: null,
      keys: null,
      values: null,
      [Symbol.iterator]: null,
    }));
    spyUseMemo.mockReturnValue({
      pluginID: '@console/helm-plugin',
      pluginName: '@console/helm-plugin',
      properties: {
        catalogDescription: null,
        title: null,
        type: 'HelmChart',
      },
      type: 'console.catalog/item-type',
      uid: '@console/helm-plugin[9]',
    });

    const catalogController = shallow(<CatalogController {...catalogControllerProps} />);

    expect(catalogController.find(PageHeading).props().title).toEqual('Default title');
    expect(catalogController.find('[data-test-id="catalog-page-description"]').text()).toEqual(
      'Default description',
    );
  });
});
