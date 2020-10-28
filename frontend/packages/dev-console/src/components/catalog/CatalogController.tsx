import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils';
import { CatalogService } from './service/CatalogServiceProvider';

type CatalogControllerProps = CatalogService;

const CatalogController: React.FC<CatalogControllerProps> = ({ items, loaded, type }) => {
  if (!loaded) return <LoadingBox />;

  return (
    <>
      <h1>Catalog Type - {type}</h1>
      <h2>Loaded Catalog Items - {items.length}</h2>
    </>
  );
};

export default CatalogController;
