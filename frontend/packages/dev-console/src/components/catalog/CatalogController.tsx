import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const queryParams = useQueryParams();

  const defaultTitle = t('devconsole~Developer Catalog');
  const defaultDescription = t(
    'devconsole~Add shared applications, services, event sources, or source-to-image builders to your project from the developer catalog. Cluster administrators can customize the content made available in the catalog.',
  );

  const typeExtension = React.useMemo(
    () => catalogExtensions?.find((extension) => extension.properties.type === type),
    [catalogExtensions, type],
  );

  const title = typeExtension?.properties.title ?? defaultTitle;
  const description = typeExtension?.properties.catalogDescription ?? defaultDescription;

  const filterPreference: string[] = [];

  const filterGroups: string[] = React.useMemo(() => {
    return (
      typeExtension?.properties.filters?.map((filter: CatalogItemAttribute) => filter.attribute) ??
      []
    );
  }, [typeExtension]);

  const filterGroupNameMap: CatalogStringMap = React.useMemo(() => {
    return (
      typeExtension?.properties.filters?.reduce((map, filter: CatalogItemAttribute) => {
        map[filter.attribute] = filter.label;
        return map;
      }, {}) ?? {}
    );
  }, [typeExtension]);

  const groupings: CatalogStringMap = React.useMemo(() => {
    return (
      typeExtension?.properties.groupings?.reduce((map, group: CatalogItemAttribute) => {
        map[group.attribute] = group.label;
        return map;
      }, {}) ?? {}
    );
  }, [typeExtension]);

  const breadcrumbs = React.useMemo(() => {
    const categoryParam = queryParams.get(CatalogQueryParams.CATEGORY);
    const keywordParam = queryParams.get(CatalogQueryParams.KEYWORD);
    const sortParam = queryParams.get(CatalogQueryParams.SORT_ORDER);
    const params = new URLSearchParams({
      ...(categoryParam ? { [CatalogQueryParams.CATEGORY]: categoryParam } : {}),
      ...(keywordParam ? { [CatalogQueryParams.KEYWORD]: keywordParam } : {}),
      ...(sortParam ? { [CatalogQueryParams.SORT_ORDER]: sortParam } : {}),
    });
    const crumbs = [
      {
        name: t('devconsole~Developer Catalog'),
        path: `${pathname}?${params.toString()}`,
      },
    ];

    if (type) {
      crumbs.push({
        name: title,
        path: `${pathname}?${CatalogQueryParams.TYPE}=${type}`,
      });
    }

    return crumbs;
  }, [pathname, queryParams, t, title, type]);

  const availableCategories = useCatalogCategories();

  const selectedItem = React.useMemo(() => {
    const selectedId = queryParams.get(CatalogQueryParams.SELECTED_ID);
    return items.find((it) => selectedId === it.uid);
  }, [items, queryParams]);

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
              label={t('devconsole~Catalog items')}
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
