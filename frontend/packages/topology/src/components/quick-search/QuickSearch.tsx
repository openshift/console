import * as React from 'react';
import CatalogServiceProvider, {
  CatalogService,
} from '@console/dev-console/src/components/catalog/service/CatalogServiceProvider';
import QuickSearchController from './QuickSearchController';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ namespace, viewContainer }) => (
  <CatalogServiceProvider namespace={namespace}>
    {(catalogService: CatalogService) => (
      <QuickSearchController
        {...catalogService}
        namespace={namespace}
        viewContainer={viewContainer}
      />
    )}
  </CatalogServiceProvider>
);

export default React.memo(QuickSearch);
