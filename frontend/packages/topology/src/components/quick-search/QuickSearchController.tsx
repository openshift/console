import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getQueryArgument } from '@console/internal/components/utils';
import { quickSearch } from './utils/quick-search-utils';
import QuickSearchButton from './QuickSearchButton';
import QuickSearchModal from './QuickSearchModal';
import { QuickSearchData, QuickSearchProviders } from './utils/quick-search-types';

type QuickSearchControllerProps = {
  namespace: string;
  viewContainer?: HTMLElement;
  quickSearchProviders: QuickSearchProviders;
  allItemsLoaded: boolean;
};

const QuickSearchController: React.FC<QuickSearchControllerProps> = ({
  namespace,
  quickSearchProviders,
  viewContainer,
  allItemsLoaded,
}) => {
  const [isQuickSearchActive, setIsQuickSearchActive] = React.useState<boolean>(
    !!getQueryArgument('catalogSearch'),
  );
  const { t } = useTranslation();

  const searchCatalog = React.useCallback(
    (searchTerm: string): QuickSearchData => {
      return quickSearchProviders.reduce(
        (acc, quickSearchProvider) => {
          const items = quickSearchProvider.loaded
            ? quickSearch(quickSearchProvider.items, searchTerm)
            : [];
          const itemCount = items.length;
          const viewAllLink =
            itemCount > 0
              ? [
                  {
                    label: t(quickSearchProvider.catalogLinkLabel, { itemCount }),
                    to: quickSearchProvider.getCatalogURL(searchTerm, namespace),
                    catalogType: quickSearchProvider.catalogType,
                  },
                ]
              : [];
          return {
            filteredItems: [...acc.filteredItems, ...items].sort((item1, item2) =>
              item1.name.localeCompare(item2.name),
            ),
            viewAllLinks: [...acc.viewAllLinks, ...viewAllLink],
          };
        },
        { filteredItems: [], viewAllLinks: [] },
      );
    },
    [namespace, quickSearchProviders, t],
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { nodeName } = e.target as Element;
      if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        setIsQuickSearchActive(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <>
      <QuickSearchButton onClick={() => setIsQuickSearchActive(true)} />
      <QuickSearchModal
        isOpen={isQuickSearchActive}
        closeModal={() => setIsQuickSearchActive(false)}
        namespace={namespace}
        allCatalogItemsLoaded={allItemsLoaded}
        searchCatalog={searchCatalog}
        viewContainer={viewContainer}
      />
    </>
  );
};

export default QuickSearchController;
