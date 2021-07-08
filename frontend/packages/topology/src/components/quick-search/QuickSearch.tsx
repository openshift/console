import * as React from 'react';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import { QuickStart } from '@console/app/src/components/quick-starts/utils/quick-start-types';
import CatalogServiceProvider, {
  CatalogService,
} from '@console/dev-console/src/components/catalog/service/CatalogServiceProvider';
import QuickSearchController from './QuickSearchController';
import { QuickSearchProviders } from './utils/quick-search-types';
import { useTransformedQuickStarts } from './utils/quick-search-utils';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Contents: React.FC<{
  quickStarts: QuickStart[];
  quickStartsLoaded: boolean;
  catalogService: CatalogService;
  catalogServiceSample: CatalogService;
} & QuickSearchProps> = ({
  quickStarts,
  quickStartsLoaded,
  catalogService,
  catalogServiceSample,
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
}) => {
  const quickStartItems = useTransformedQuickStarts(quickStarts);
  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'devCatalog',
      items: catalogService.items,
      loaded: catalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) => `/catalog/ns/${ns}?keyword=${searchTerm}`,
      // t('topology~View all developer catalog items ({{itemCount, number}})')
      catalogLinkLabel: 'topology~View all developer catalog items ({{itemCount, number}})',
      extensions: catalogService.catalogExtensions,
    },
    {
      catalogType: 'quickStarts',
      items: quickStartItems,
      loaded: quickStartsLoaded,
      getCatalogURL: (searchTerm: string) => `/quickstart?keyword=${searchTerm}`,
      // t('topology~View all quick starts ({{itemCount, number}})'
      catalogLinkLabel: 'topology~View all quick starts ({{itemCount, number}})',
      extensions: catalogService.catalogExtensions,
    },
    {
      catalogType: 'Samples',
      items: catalogServiceSample.items,
      loaded: catalogServiceSample.loaded,
      getCatalogURL: (searchTerm: string, ns: string) => `/samples/ns/${ns}?keyword=${searchTerm}`,
      // t('topology~View all samples ({{itemCount, number}})'
      catalogLinkLabel: 'topology~View all samples ({{itemCount, number}})',
      extensions: catalogService.catalogExtensions,
    },
  ];
  return (
    <QuickSearchController
      quickSearchProviders={quickSearchProviders}
      allItemsLoaded={catalogService.loaded && quickStartsLoaded}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    />
  );
};

const QuickSearch: React.FC<QuickSearchProps> = ({
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
}) => {
  return (
    <CatalogServiceProvider namespace={namespace} catalogId="dev-catalog">
      {(catalogService: CatalogService) => (
        <CatalogServiceProvider namespace={namespace} catalogId="samples-catalog">
          {(catalogServiceSample: CatalogService) => (
            <QuickStartsLoader>
              {(quickStarts, quickStartsLoaded) => (
                <Contents
                  {...{
                    namespace,
                    viewContainer,
                    isOpen,
                    setIsOpen,
                    catalogService,
                    catalogServiceSample,
                    quickStarts,
                    quickStartsLoaded,
                  }}
                />
              )}
            </QuickStartsLoader>
          )}
        </CatalogServiceProvider>
      )}
    </CatalogServiceProvider>
  );
};

export default React.memo(QuickSearch);
