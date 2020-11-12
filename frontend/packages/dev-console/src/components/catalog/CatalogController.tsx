import * as React from 'react';
import * as _ from 'lodash';
import { PageHeading, skeletonCatalog, StatusBox } from '@console/internal/components/utils';
import { CatalogService } from './service/CatalogServiceProvider';
import CatalogView from './catalog-view/CatalogView';

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

  // initialFilters cannot be typed as it has multiple usages
  const getAvailableFilters = React.useCallback(
    (initialFilters) => {
      const filters = _.cloneDeep(initialFilters);
      filters.type = catalogExtensions.reduce((typeFilters, extension) => {
        typeFilters[extension.properties.type] = {
          label: extension.properties.title,
          value: extension.properties.type,
          active: false,
        };

        return typeFilters;
      }, {});

      return filters;
    },
    [catalogExtensions],
  );

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
              <CatalogView
                items={items}
                description={description}
                getAvailableFilters={getAvailableFilters}
              />
            </StatusBox>
          </div>
        </div>
      </div>
    </>
  );
};

export default CatalogController;
