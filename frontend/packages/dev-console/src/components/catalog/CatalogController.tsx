import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import {
  PageHeading,
  skeletonCatalog,
  StatusBox,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';
import { CatalogItem, CatalogItemAttribute } from '@console/plugin-sdk';
import { DEV_CATALOG_FILTER_KEY, useQueryParams } from '@console/shared';

import { CatalogService } from './service/CatalogServiceProvider';
import CatalogView from './catalog-view/CatalogView';
import useCatalogCategories from './hooks/useCatalogCategories';
import CatalogDetailsModal from './details/CatalogDetailsModal';
import CatalogTile from './CatalogTile';
import { determineAvailableFilters } from './utils/filter-utils';
import { CatalogFilters, CatalogQueryParams, CatalogStringMap, CatalogType } from './utils/types';

type CatalogControllerProps = CatalogService;

const CatalogController: React.FC<CatalogControllerProps> = ({
  type,
  items,
  itemsMap,
  loaded,
  loadError,
  catalogExtensions,
}) => {
  let title = 'Developer Catalog';
  let description =
    'Add shared applications, services, event sources, or source-to-image builders to your project from the developer catalog. Cluster administrators can customize the content made available in the catalog.';

  const queryParams = useQueryParams();
  const filterGroups: string[] = [];
  const filterGroupNameMap: CatalogStringMap = {};
  const filterPreference: string[] = [];
  const groupings: CatalogStringMap = {};

  const selectedId = queryParams.get(CatalogQueryParams.SELECTED_ID);
  queryParams.delete(CatalogQueryParams.TYPE);
  const breadcrumbs = [
    {
      name: 'Developer Catalog',
      path: `/catalog?${queryParams.toString()}`,
    },
  ];

  if (type) {
    const typeExtension = catalogExtensions?.find(
      (extension) => extension.properties.type === type,
    );
    title = typeExtension?.properties.title ?? title;
    description = typeExtension?.properties.catalogDescription ?? description;

    breadcrumbs.push({
      name: title,
      path: `/catalog?${CatalogQueryParams.TYPE}=${type}`,
    });

    const typeFilters = typeExtension?.properties.filters;
    typeFilters &&
      typeFilters.forEach((filter: CatalogItemAttribute) => {
        filterGroups.push(filter.attribute);
        filterGroupNameMap[filter.attribute] = filter.label;
      });

    const typeGroupings = typeExtension?.properties.groupings;
    typeGroupings && typeGroupings.forEach((group) => (groupings[group.attribute] = group.label));
  }

  const availableCategories = useCatalogCategories();

  const selectedItem = React.useMemo(() => items.find((it) => selectedId === it.uid), [
    items,
    selectedId,
  ]);

  const catalogTypes: CatalogType[] = React.useMemo(() => {
    const types = catalogExtensions.map((extension) => ({
      label: extension.properties.title,
      value: extension.properties.type,
      description: extension.properties.typeDescription,
    }));

    return _.sortBy(types, ({ label }) => label.toLowerCase());
  }, [catalogExtensions]);

  const catalogItems = React.useMemo(() => (type ? itemsMap[type] : items), [
    items,
    itemsMap,
    type,
  ]);

  const availableFilters: CatalogFilters = React.useMemo(
    () => determineAvailableFilters({}, catalogItems, filterGroups),
    [catalogItems, filterGroups],
  );

  const openDetailsPanel = React.useCallback((item: CatalogItem): void => {
    setQueryArgument(CatalogQueryParams.SELECTED_ID, item.uid);
  }, []);

  const closeDetailsPanel = React.useCallback((): void => {
    removeQueryArgument(CatalogQueryParams.SELECTED_ID);
  }, []);

  const renderTile = React.useCallback(
    (item: CatalogItem) => (
      <CatalogTile
        item={item}
        onClick={openDetailsPanel}
        catalogTypes={!type ? catalogTypes : []}
      />
    ),
    [catalogTypes, openDetailsPanel, type],
  );

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title={title} breadcrumbs={type && items?.length > 0 ? breadcrumbs : null} />
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
                catalogType={type}
                catalogTypes={catalogTypes}
                items={catalogItems}
                categories={availableCategories}
                filters={availableFilters}
                filterGroups={filterGroups}
                filterGroupNameMap={filterGroupNameMap}
                filterStoreKey={DEV_CATALOG_FILTER_KEY}
                filterRetentionPreference={filterPreference}
                groupings={groupings}
                renderTile={renderTile}
              />
              <CatalogDetailsModal item={selectedItem} onClose={closeDetailsPanel} />
            </StatusBox>
          </div>
        </div>
      </div>
    </>
  );
};

export default CatalogController;
