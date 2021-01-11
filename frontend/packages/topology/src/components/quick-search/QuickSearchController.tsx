import * as React from 'react';
import { CatalogService } from '@console/dev-console/src/components/catalog/service/CatalogServiceProvider';
import { getQueryArgument } from '@console/internal/components/utils';
import QuickSearchButton from './QuickSearchButton';
import QuickSearchModal from './QuickSearchModal';

type QuickSearchControllerProps = CatalogService & {
  namespace: string;
  viewContainer?: HTMLElement;
};

const QuickSearchController: React.FC<QuickSearchControllerProps> = ({
  namespace,
  searchCatalog,
  loaded,
  viewContainer,
}) => {
  const [isQuickSearchActive, setIsQuickSearchActive] = React.useState<boolean>(
    !!getQueryArgument('catalogSearch'),
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
        allCatalogItemsLoaded={loaded}
        searchCatalog={searchCatalog}
        viewContainer={viewContainer}
      />
    </>
  );
};

export default QuickSearchController;
