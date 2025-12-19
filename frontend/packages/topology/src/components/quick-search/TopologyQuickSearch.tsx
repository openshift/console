import type { FC } from 'react';
import { memo } from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { QuickStartsLoader } from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import {
  QuickSearchController,
  QuickSearchProviders,
  CatalogService,
  CatalogServiceProvider,
} from '@console/shared';
import { useTransformedQuickStarts } from './topology-quick-search-utils';

interface QuickSearchProps {
  namespace: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Contents: FC<
  {
    quickStarts: QuickStart[];
    quickStartsLoaded: boolean;
    catalogService: CatalogService;
    catalogServiceSample: CatalogService;
  } & QuickSearchProps
> = ({
  quickStarts,
  quickStartsLoaded,
  catalogService,
  catalogServiceSample,
  namespace,
  isOpen,
  setIsOpen,
}) => {
  const { t } = useTranslation();

  const DEFAULT_LIMIT_ITEM_COUNT = 5;
  const quickStartItems = useTransformedQuickStarts(quickStarts);
  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'devCatalog',
      items: catalogService.items,
      loaded: catalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) => `/catalog/ns/${ns}?keyword=${searchTerm}`,
      // t('topology~View all software catalog items ({{itemCount, number}})')
      catalogLinkLabel: 'topology~View all software catalog items ({{itemCount, number}})',
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
      searchPlaceholder={`${t('topology~Add to Project')}...`}
      namespace={namespace}
      isOpen={isOpen}
      limitItemCount={DEFAULT_LIMIT_ITEM_COUNT}
      setIsOpen={setIsOpen}
    />
  );
};

const TopologyQuickSearch: FC<QuickSearchProps> = ({ namespace, isOpen, setIsOpen }) => {
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

export default memo(TopologyQuickSearch);
