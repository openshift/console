import * as React from 'react';
import CatalogServiceProvider, {
  CatalogService,
} from '@console/dev-console/src/components/catalog/service/CatalogServiceProvider';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import QuickSearchController from './QuickSearchController';
import {
  QuickStartContext,
  QuickStartContextValues,
} from '@console/app/src/components/quick-starts/utils/quick-start-context';
import { getTransformedQuickStarts } from './utils/quick-search-utils';
import { QuickSearchProviders } from './utils/quick-search-types';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ namespace, viewContainer }) => {
  const { setActiveQuickStart } = React.useContext<QuickStartContextValues>(QuickStartContext);
  return (
    <CatalogServiceProvider namespace={namespace}>
      {(catalogService: CatalogService) => (
        <QuickStartsLoader>
          {(quickStarts, qsLoaded) => {
            const quickStartItems = qsLoaded
              ? getTransformedQuickStarts(quickStarts, setActiveQuickStart)
              : [];
            const quickSearchProviders: QuickSearchProviders = [
              {
                catalogType: 'devCatalog',
                items: catalogService.items,
                loaded: catalogService.loaded,
                getCatalogURL: (searchTerm: string, ns: string) =>
                  `/catalog/ns/${ns}?keyword=${searchTerm}`,
                // t('topology~View all developer catalog items ({{itemCount, number}})')
                catalogLinkLabel:
                  'topology~View all developer catalog items ({{itemCount, number}})',
              },
              {
                catalogType: 'quickStarts',
                items: quickStartItems,
                loaded: qsLoaded,
                getCatalogURL: (searchTerm: string) => `/quickstart?keyword=${searchTerm}`,
                // t('topology~View all quick starts ({{itemCount, number}})'
                catalogLinkLabel: 'topology~View all quick starts ({{itemCount, number}})',
              },
            ];
            return (
              <QuickSearchController
                quickSearchProviders={quickSearchProviders}
                allItemsLoaded={catalogService.loaded && qsLoaded}
                namespace={namespace}
                viewContainer={viewContainer}
              />
            );
          }}
        </QuickStartsLoader>
      )}
    </CatalogServiceProvider>
  );
};

export default React.memo(QuickSearch);
