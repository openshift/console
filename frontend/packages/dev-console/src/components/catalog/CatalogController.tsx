import * as React from 'react';
import {
  PageHeading,
  skeletonCatalog,
  StatusBox,
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';
import { CatalogService } from './service/CatalogServiceProvider';
import CatalogView from './catalog-view/CatalogView';
import useCatalogCategories from './hooks/useCatalogCategories';
import { CatalogItem, CatalogItemAttribute } from '@console/plugin-sdk';
import CatalogDetailsModal from './details/CatalogDetailsModal';
import CatalogTile from './CatalogTile';
import { DEV_CATALOG_FILTER_KEY } from '@console/shared';
import { defaultFilters, determineAvailableFilters } from './utils/filter-utils';
import Helmet from 'react-helmet';
import { CatalogFilters, CatalogStringMap, CatalogType } from './utils/types';

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
    'Add shared applications, services, event sources, or source-to-image builders to your project from the Developer catalog. Cluster administrators can customize the content made available in the catalog.';

  const [selectedItem, setSelectedItem] = React.useState<CatalogItem>();
  const [catalogType, setCatalogType] = React.useState<string>(type);

  const availableCategories = useCatalogCategories();

  // Filter property white list
  const filterGroups: string[] = [];

  const filterGroupNameMap: CatalogStringMap = {};

  const filterPreference: string[] = [];

  const groupings: CatalogStringMap = {};

  const breadcrumbs = [
    {
      name: 'Developer Catalog',
      path: '/catalog',
    },
  ];

  if (type) {
    const typeExtension = catalogExtensions?.find(
      (extension) => extension.properties.type === type,
    );
    title = typeExtension?.properties.title;
    description = typeExtension?.properties.catalogDescription;

    breadcrumbs.push({
      name: title,
      path: `/catalog?catalogType=${type}`,
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

  const catalogTypes: CatalogType[] = React.useMemo(
    () =>
      catalogExtensions.map((extension) => ({
        label: extension.properties.title,
        value: extension.properties.type,
        description: extension.properties.typeDescription,
        numItems: itemsMap[extension.properties.type]?.length ?? 0,
      })),
    [catalogExtensions, itemsMap],
  );

  const availableFilters: CatalogFilters = React.useMemo(
    () => determineAvailableFilters(defaultFilters, items, filterGroups),
    [filterGroups, items],
  );

  React.useEffect(() => {
    const selectedId = getQueryArgument('selectedId');
    if (selectedId) {
      const item = items.find((it) => selectedId === it.uid);
      setSelectedItem(item);
    }
  }, [items]);

  const openDetailsPanel = React.useCallback((item: CatalogItem): void => {
    setQueryArgument('selectedId', item.uid);
    setSelectedItem(item);
  }, []);

  const closeDetailsPanel = React.useCallback((): void => {
    removeQueryArgument('selectedId');
    setSelectedItem(null);
  }, []);

  const renderTile = React.useCallback(
    (item: CatalogItem) => (
      <CatalogTile
        item={item}
        onClick={openDetailsPanel}
        catalogTypes={!catalogType ? catalogTypes : []}
      />
    ),
    [catalogType, catalogTypes, openDetailsPanel],
  );

  const handleCatalogTypeChange = React.useCallback((value) => {
    setCatalogType(value);
    setQueryArgument('catalogType', value);
  }, []);

  const catalogItems = React.useMemo(() => (catalogType ? itemsMap[catalogType] : items), [
    catalogType,
    items,
    itemsMap,
  ]);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title={title} breadcrumbs={catalogType ? breadcrumbs : null} />
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
                catalogType={catalogType}
                catalogTypes={catalogTypes}
                onCatalogTypeChange={handleCatalogTypeChange}
                items={catalogItems}
                availableCategories={availableCategories}
                availableFilters={availableFilters}
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
