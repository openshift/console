import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import * as UseQueryParams from '@console/shared/src/hooks/useQueryParams';
import CatalogController from '../CatalogController';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => {
    return 'path';
  },
}));

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
      catagory: null,
      keyword: null,
      sortOrder: null,
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
    expect(catalogController.find(PageHeading).props().helpText).toEqual(
      'Helm Catalog description',
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
    expect(catalogController.find(PageHeading).props().helpText).toEqual('Default description');
  });
});
