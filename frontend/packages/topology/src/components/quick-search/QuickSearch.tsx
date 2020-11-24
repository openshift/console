import * as React from 'react';
import CatalogServiceProvider, {
  CatalogService,
} from '@console/dev-console/src/components/catalog/service/CatalogServiceProvider';
import QuickSearchController from './QuickSearchController';

interface QuickSearchProps {
  namespace: string;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ namespace }) => {
  return (
    <CatalogServiceProvider namespace={namespace}>
      {(catalogService: CatalogService) => (
        <QuickSearchController {...catalogService} namespace={namespace} />
      )}
    </CatalogServiceProvider>
  );
};

export default QuickSearch;
