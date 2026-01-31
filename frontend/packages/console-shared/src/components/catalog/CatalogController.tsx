import type { ReactElement, FC } from 'react';
import { useMemo, useCallback } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';
import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import { ResolvedExtension, CatalogItemType, CatalogCategory } from '@console/dynamic-plugin-sdk';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { useQueryParamsMutator } from '@console/internal/components/utils/router';
import { skeletonCatalog } from '@console/internal/components/utils/skeleton-catalog';
import { StatusBox } from '@console/internal/components/utils/status-box';
import OLMv1Alert from '@console/operator-lifecycle-manager-v1/src/components/OLMv1Alert';
import { FLAG_OLMV1_ENABLED } from '@console/operator-lifecycle-manager-v1/src/const';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { useFlag } from '../../hooks/flag';
import { useQueryParams } from '../../hooks/useQueryParams';
import PageBody from '../layout/PageBody';
import CatalogView from './catalog-view/CatalogView';
import CatalogTile from './CatalogTile';
import CatalogDetailsModal from './details/CatalogDetailsModal';
import { getURLWithParams, useGetAllDisabledSubCatalogs } from './utils/catalog-utils';
import { determineAvailableFilters } from './utils/filter-utils';
import {
  CatalogFilters,
  CatalogQueryParams,
  CatalogService,
  CatalogStringMap,
  CatalogType,
  CatalogFilterGroupMap,
} from './utils/types';

type CatalogControllerProps = CatalogService & {
  enableDetailsPanel?: boolean;
  hideSidebar?: boolean;
  title: string;
  description: string | ReactElement;
  categories?: CatalogCategory[];
};

const CatalogController: FC<CatalogControllerProps> = ({
  type,
  items,
  itemsMap,
  loaded,
  loadError,
  catalogExtensions,
  enableDetailsPanel,
  title: defaultTitle,
  description: defaultDescription,
  hideSidebar,
  categories,
}) => {
  const { setQueryArgument, removeQueryArgument } = useQueryParamsMutator();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const queryParams = useQueryParams();
  const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
  const techPreviewEnabled = useFlag(FLAG_TECH_PREVIEW);
  const olmv1Enabled = useFlag(FLAG_OLMV1_ENABLED);

  // TODO(CONSOLE-4823): Remove this hard-coded alert when OLMv1 GAs
  const showOLMv1Alert = techPreviewEnabled && olmv1Enabled && type === 'operator';

  const typeExtension: ResolvedExtension<CatalogItemType> = useMemo(
    () => catalogExtensions?.find((extension) => extension.properties.type === type),
    [catalogExtensions, type],
  );

  const title = typeExtension?.properties?.title ?? defaultTitle;
  const sortFilterGroups = typeExtension?.properties?.sortFilterGroups ?? true;
  const getCatalogTypeDescription = () => {
    if (typeof typeExtension?.properties?.catalogDescription === 'string') {
      return typeExtension?.properties?.catalogDescription;
    }
    if (typeof typeExtension?.properties?.catalogDescription === 'function') {
      const Component = typeExtension.properties.catalogDescription;
      return <Component />;
    }
    return defaultDescription;
  };

  const filterGroups: string[] = useMemo(() => {
    return typeExtension?.properties.filters?.map((filter) => filter.attribute) ?? [];
  }, [typeExtension]);

  const filterGroupMap: CatalogFilterGroupMap = useMemo(() => {
    return (
      typeExtension?.properties.filters?.reduce((map, filter) => {
        map[filter.attribute] = filter;
        return map;
      }, {}) ?? {}
    );
  }, [typeExtension]);

  const groupings: CatalogStringMap = useMemo(() => {
    return (
      typeExtension?.properties.groupings?.reduce((map, group) => {
        map[group.attribute] = group.label;
        return map;
      }, {}) ?? {}
    );
  }, [typeExtension]);

  const breadcrumbs = useMemo(() => {
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
        name: t('console-shared~Software Catalog'),
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

  const selectedItem = useMemo(() => {
    const selectedId = queryParams.get(CatalogQueryParams.SELECTED_ID);
    return items.find((it) => selectedId === it.uid);
  }, [items, queryParams]);

  const catalogTypes: CatalogType[] = useMemo(() => {
    const types = catalogExtensions
      .map((extension) => ({
        label: extension.properties.title,
        value: extension.properties.type,
        description: extension.properties.typeDescription,
      }))
      .filter((extension) => !disabledSubCatalogs?.includes(extension.value));

    return _.sortBy(types, ({ label }) => label.toLowerCase());
  }, [catalogExtensions, disabledSubCatalogs]);

  const catalogItems = useMemo(() => (type ? itemsMap[type] : items), [items, itemsMap, type]);

  const availableFilters: CatalogFilters = useMemo(
    () => determineAvailableFilters({}, catalogItems, filterGroups),
    [catalogItems, filterGroups],
  );

  const openDetailsPanel = useCallback(
    (item: CatalogItem): void => {
      setQueryArgument(CatalogQueryParams.SELECTED_ID, item.uid);
    },
    [setQueryArgument],
  );

  const closeDetailsPanel = useCallback((): void => {
    removeQueryArgument(CatalogQueryParams.SELECTED_ID);
  }, [removeQueryArgument]);

  const renderTile = useCallback(
    (item: CatalogItem) => (
      <CatalogTile
        item={item}
        catalogTypes={catalogTypes}
        onClick={
          enableDetailsPanel
            ? openDetailsPanel
            : item.cta?.callback
            ? () => item.cta.callback()
            : null
        }
        href={
          !enableDetailsPanel
            ? item.cta?.href
            : getURLWithParams(CatalogQueryParams.SELECTED_ID, item.uid)
        }
      />
    ),
    [catalogTypes, openDetailsPanel, enableDetailsPanel],
  );

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageBody>
        <PageHeading
          title={title}
          breadcrumbs={type ? breadcrumbs : null}
          helpText={getCatalogTypeDescription()}
        />
        {/* TODO(CONSOLE-4823): Remove this hard-coded alert when OLMv1 GAs */}
        {showOLMv1Alert && (
          <div className="pf-v6-u-mx-md">
            <OLMv1Alert />
          </div>
        )}
        <StatusBox
          skeleton={skeletonCatalog}
          data={items}
          loaded={loaded}
          loadError={loadError}
          label={t('console-shared~Catalog items')}
        >
          <CatalogView
            catalogType={type}
            catalogTypes={catalogTypes}
            items={catalogItems}
            categories={categories}
            filters={availableFilters}
            filterGroups={filterGroups}
            filterGroupMap={filterGroupMap}
            groupings={groupings}
            renderTile={renderTile}
            hideSidebar={hideSidebar}
            sortFilterGroups={sortFilterGroups}
          />
          <CatalogDetailsModal item={selectedItem} onClose={closeDetailsPanel} />
        </StatusBox>
      </PageBody>
    </>
  );
};

export default CatalogController;
