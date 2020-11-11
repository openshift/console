import * as React from 'react';
import { PageHeading, skeletonCatalog, StatusBox } from '@console/internal/components/utils';
import { CatalogService } from './service/CatalogServiceProvider';

type CatalogControllerProps = CatalogService;

const CatalogController: React.FC<CatalogControllerProps> = ({
  type,
  items,
  loaded,
  loadError,
  catalogExtensions,
}) => {
  let title = 'Developer Catalog';
  let description =
    'Add shared applications, services, event sources, or source-to-image builders to your project from the Developer catalog. Cluster administrators can customize the content made available in the catalog.';

  if (type && catalogExtensions.length > 0) {
    title = catalogExtensions[0].properties.title;
    description = catalogExtensions[0].properties.catalogDescription;
  }

  return (
    <>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title={title} />
          <p className="co-catalog-page__description">{description}</p>
          <div className="co-catalog__body">
            <StatusBox
              skeleton={skeletonCatalog}
              data={items}
              loaded={loaded}
              loadError={loadError}
              label="Catalog items"
            >
              <h2>Loaded Catalog Items - {items.length}</h2>
            </StatusBox>
          </div>
        </div>
      </div>
    </>
  );
};

export default CatalogController;
