import * as React from 'react';
import { getQueryArgument } from '@console/internal/components/utils';
import NamespacedPage from '../NamespacedPage';
import CatalogServiceProvider from './service/CatalogServiceProvider';
import CatalogController from './CatalogController';

const CatalogPage = () => {
  const catalogType = getQueryArgument('catalogType');

  return (
    <NamespacedPage hideApplications>
      <CatalogServiceProvider type={catalogType}>
        {(service) => <CatalogController {...service} />}
      </CatalogServiceProvider>
    </NamespacedPage>
  );
};

export default CatalogPage;
