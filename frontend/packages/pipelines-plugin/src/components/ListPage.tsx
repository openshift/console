/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import { Button, Grid, GridItem, TextInput, TextInputProps } from '@patternfly/react-core';
import { SimpleDropdown } from '@patternfly/react-templates';
// eslint-disable-next-line no-restricted-imports
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom-v5-compat';
import { ColumnLayout } from '@console/dynamic-plugin-sdk';
import { filterList } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import { ListPageHeader } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ErrorPage404 } from '@console/internal/components/error';
import { FilterToolbar, RowFilter } from '@console/internal/components/filter-toolbar';
import { storagePrefix } from '@console/internal/components/row-filter';
import {
  FirehoseResource,
  FirehoseResourcesResult,
  FirehoseResultObject,
  inject,
  kindObj,
  makeQuery,
  makeReduxID,
  RequireCreatePermission,
} from '@console/internal/components/utils';
import {
  K8sKind,
  K8sResourceCommon,
  referenceForModel,
  Selector,
} from '@console/internal/module/k8s';
import { useDocumentListener, KEYBOARD_SHORTCUTS, useDeepCompareMemoize } from '@console/shared';
import { withFallback, ErrorBoundaryFallbackPage } from '@console/shared/src/components/error';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import ListPropProvider from './ListPropProvider';

type CreateProps = {
  action?: string;
  createLink?: (item: string) => string;
  to?: string;
  items?: {
    [key: string]: string;
  };
  onClick?: () => void;
  isDisabled?: boolean;
  id?: string;
};

type TextFilterProps = Omit<TextInputProps, 'type' | 'tabIndex'> & {
  label?: string;
};

export const TextFilter: React.FC<TextFilterProps> = (props) => {
  const { label, placeholder, autoFocus = false, ...otherInputProps } = props;
  const { ref } = useDocumentListener<HTMLInputElement>();
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t('public~Filter {{label}}...', { label });

  return (
    <div className="co-text-filter">
      <TextInput
        {...otherInputProps}
        className="co-text-filter__text-input"
        data-test-id="item-filter"
        aria-label={placeholderText}
        placeholder={placeholderText}
        ref={ref}
        autoFocus={autoFocus}
        tabIndex={0}
        type="text"
      />
      <span className="co-text-filter__feedback">
        <kbd className="co-kbd co-kbd__filter-input">{KEYBOARD_SHORTCUTS.focusFilterInput}</kbd>
      </span>
    </div>
  );
};
TextFilter.displayName = 'TextFilter';

// TODO (jon) make this into "withListPageFilters" HOC

type ListPageWrapperProps<L = any, C = any> = {
  ListComponent: React.ComponentType<L>;
  kinds: string[];
  filters?: any;
  flatten?: Flatten;
  rowFilters?: RowFilter[];
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  columnLayout?: ColumnLayout;
  name?: string;
  resources?: FirehoseResourcesResult;
  reduxIDs?: string[];
  textFilter?: string;
  nameFilterPlaceholder?: string;
  namespace?: string;
  labelFilterPlaceholder?: string;
  label?: string;
  staticFilters?: { key: string; value: string }[];
  customData?: C;
  hideColumnManagement?: boolean;
  nameFilter?: string;
  data?: any;
};

export const ListPageWrapper: React.FC<ListPageWrapperProps> = (props) => {
  const {
    flatten,
    ListComponent,
    reduxIDs,
    rowFilters,
    textFilter,
    nameFilterPlaceholder,
    labelFilterPlaceholder,
    hideNameLabelFilters,
    hideLabelFilter,
    columnLayout,
    name,
    nameFilter,
    data,
  } = props;
  const dispatch = useDispatch();
  const memoizedIds = useDeepCompareMemoize(reduxIDs);

  React.useEffect(() => {
    if (!_.isNil(nameFilter)) {
      memoizedIds.forEach((id) => dispatch(filterList(id, 'name', { selected: [nameFilter] })));
    }
  }, [dispatch, nameFilter, memoizedIds]);

  const dta = flatten ? flatten(data) : [];
  const Filter = (
    <FilterToolbar
      rowFilters={rowFilters}
      nameFilterPlaceholder={nameFilterPlaceholder}
      labelFilterPlaceholder={labelFilterPlaceholder}
      reduxIDs={reduxIDs}
      textFilter={textFilter}
      hideNameLabelFilters={hideNameLabelFilters}
      hideLabelFilter={hideLabelFilter}
      columnLayout={columnLayout}
      uniqueFilterName={name}
      {...props}
      data={dta}
    />
  );

  return (
    <div>
      {!_.isEmpty(dta) && Filter}
      <Grid>
        <GridItem>
          <ListComponent {...props} data={dta} />
        </GridItem>
      </Grid>
    </div>
  );
};

ListPageWrapper.displayName = 'ListPageWrapper_';

export type FireManProps = {
  canCreate?: boolean;
  textFilter?: string;
  createAccessReview?: {
    model: K8sKind;
    namespace?: string;
  };
  createButtonText?: string;
  createProps?: CreateProps;
  fieldSelector?: string;
  filterLabel?: string;
  resources: FirehoseResource[];
  badge?: React.ReactNode;
  helpText?: React.ReactNode;
  title?: string;
  autoFocus?: boolean;
  cluster?: string; // TODO remove multicluster
};

export const FireMan: React.FC<FireManProps & { filterList?: typeof filterList }> = (props) => {
  const {
    cluster,
    resources,
    textFilter,
    canCreate,
    createAccessReview,
    createButtonText,
    createProps = {},
    helpText,
    badge,
    title,
  } = props;
  const navigate = useNavigate();
  const [reduxIDs, setReduxIDs] = React.useState([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expand] = React.useState();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.forEach((v, k) => applyFilter(k, v));

    const reduxId = resources.map((r) =>
      makeReduxID(kindObj(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)),
    );
    setReduxIDs(reduxId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const reduxId = resources.map((r) =>
      makeReduxID(kindObj(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)),
    );

    if (_.isEqual(reduxId, reduxIDs)) {
      return;
    }

    // reapply filters to the new list...
    setReduxIDs(reduxId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster, resources]);

  const updateURL = (filterName: string, options: any) => {
    if (filterName !== textFilter) {
      // TODO (ggreer): support complex filters (objects, not just strings)
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (options) {
      params.set(filterName, options);
    } else {
      params.delete(filterName);
    }
    const url = new URL(window.location.href);
    navigate(`${url.pathname}?${params.toString()}${url.hash}`, { replace: true });
  };

  const applyFilter = (filterName: string, options: any) => {
    // TODO: (ggreer) lame blacklist of query args. Use a whitelist based on resource filters
    if (['q', 'kind', 'orderBy', 'sortBy'].includes(filterName)) {
      return;
    }
    if (filterName.indexOf(storagePrefix) === 0) {
      return;
    }
    reduxIDs.forEach((id) => props.filterList(id, filterName, options));
    updateURL(filterName, options);
  };

  const runOrNavigate = (itemName: string) => {
    const action = _.isFunction(createProps.action) && createProps.action(itemName);
    if (action) {
      action();
    } else if (_.isFunction(createProps.createLink)) {
      navigate(createProps.createLink(itemName), { replace: true });
    }
  };

  let createLink: any;

  if (canCreate) {
    if (createProps.to) {
      createLink = (
        <Link to={createProps.to}>
          <Button variant="primary" id="yaml-create" data-test="item-create">
            {createButtonText}
          </Button>
        </Link>
      );
    } else if (createProps.items) {
      createLink = (
        <div>
          <SimpleDropdown
            toggleProps={{
              variant: 'primary',
              id: 'item-create',
              // @ts-expect-error non-prop attribute is used for cypress
              'data-test': 'item-create',
            }}
            toggleContent={createButtonText}
            initialItems={Object.keys(createProps.items).map((item) => ({
              value: item,
              content: createProps.items[item],
              'data-test-dropdown-menu': item,
            }))}
            onSelect={(_e, value: string) => runOrNavigate(value)}
          />
        </div>
      );
    } else {
      createLink = (
        <div>
          <Button variant="primary" id="yaml-create" data-test="item-create" {...createProps}>
            {createButtonText}
          </Button>
        </div>
      );
    }
    if (!_.isEmpty(createAccessReview)) {
      createLink = (
        <RequireCreatePermission
          model={createAccessReview.model}
          namespace={createAccessReview.namespace}
        >
          {createLink}
        </RequireCreatePermission>
      );
    }
  }

  return (
    <>
      <ListPageHeader title={title} badge={badge} helpText={helpText}>
        {createLink}
      </ListPageHeader>
      <PaneBody>
        {inject(props.children, {
          resources,
          expand,
          reduxIDs,
          applyFilter,
        })}
      </PaneBody>
    </>
  );
};
FireMan.displayName = 'FireMan';

export type Flatten<
  F extends FirehoseResultObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] },
  R = any
> = (resources: FirehoseResourcesResult<F>) => R;

export type ListPageProps<L = any, C = any> = PageCommonProps<L, C> & {
  kind: string;
  helpText?: React.ReactNode;
  selector?: Selector;
  fieldSelector?: string;
  createHandler?: () => void;
  name?: string;
  filters?: any;
  limit?: number;
  nameFilter?: string;
  skipAccessReview?: boolean;
  data?: any;
};

export const ListPage = withFallback<ListPageProps>((props) => {
  const {
    autoFocus,
    canCreate,
    createButtonText,
    createHandler,
    customData,
    fieldSelector,
    filterLabel,
    labelFilterPlaceholder,
    nameFilterPlaceholder,
    filters,
    helpText,
    kind,
    limit,
    ListComponent,
    mock,
    name,
    nameFilter,
    namespace,
    selector,
    showTitle = true,
    skipAccessReview,
    textFilter,
    badge,
    hideLabelFilter,
    hideNameLabelFilters,
    hideColumnManagement,
    columnLayout,
    data,
    flatten = (_resources) => _.get(_resources, kind)?.data,
  } = props;
  const { t } = useTranslation();
  const params = useParams();
  let { createProps } = props;
  const ko = kindObj(kind);
  const { label, labelKey, labelPlural, labelPluralKey, namespaced, plural } = ko;
  const title = props.title || t(labelPluralKey) || labelPlural;
  const usedNamespace = !namespace && namespaced ? params.ns : namespace;

  let href = usedNamespace
    ? `/k8s/ns/${usedNamespace || 'default'}/${plural}/~new`
    : `/k8s/cluster/${plural}/~new`;
  if (ko.crd) {
    try {
      const ref = referenceForModel(ko);
      href = usedNamespace
        ? `/k8s/ns/${usedNamespace || 'default'}/${ref}/~new`
        : `/k8s/cluster/${ref}/~new`;
    } catch (unused) {
      /**/
    }
  }

  createProps = createProps || (createHandler ? { onClick: createHandler } : { to: href });
  const createAccessReview = skipAccessReview ? null : { model: ko, namespace: usedNamespace };
  const resources = [
    {
      fieldSelector,
      filters,
      kind,
      limit,
      name,
      namespaced,
      selector,
      prop: kind,
    },
  ];

  // Don't show row filters if props.filters were passed. The content is already filtered and the row filters will have incorrect counts.
  const rowFilters = _.isEmpty(filters) ? props.rowFilters : undefined;

  if (!namespaced && usedNamespace) {
    return <ErrorPage404 />;
  }

  return (
    <MultiListPage
      autoFocus={autoFocus}
      canCreate={canCreate}
      createAccessReview={createAccessReview}
      createButtonText={
        createButtonText || t('public~Create {{label}}', { label: t(labelKey) || label })
      }
      createProps={createProps}
      customData={customData}
      filterLabel={filterLabel || t('public~by name')}
      nameFilterPlaceholder={nameFilterPlaceholder}
      labelFilterPlaceholder={labelFilterPlaceholder}
      flatten={flatten}
      helpText={helpText}
      label={t(labelPluralKey) || labelPlural}
      ListComponent={ListComponent}
      mock={mock}
      namespace={usedNamespace}
      resources={resources}
      rowFilters={rowFilters}
      showTitle={showTitle}
      textFilter={textFilter}
      title={title}
      badge={badge}
      hideLabelFilter={hideLabelFilter}
      hideNameLabelFilters={hideNameLabelFilters}
      hideColumnManagement={hideColumnManagement}
      columnLayout={columnLayout}
      nameFilter={nameFilter}
      data={data}
    />
  );
}, ErrorBoundaryFallbackPage);

ListPage.displayName = 'ListPage';

type PageCommonProps<L = any, C = any> = {
  canCreate?: boolean;
  createButtonText?: string;
  createProps?: CreateProps;
  flatten?: Flatten;
  title?: string;
  showTitle?: boolean;
  filterLabel?: string;
  textFilter?: string;
  rowFilters?: RowFilter[];
  ListComponent: React.ComponentType<L>;
  namespace?: string;
  customData?: C;
  badge?: React.ReactNode;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  columnLayout?: ColumnLayout;
  hideColumnManagement?: boolean;
  labelFilterPlaceholder?: string;
  nameFilterPlaceholder?: string;
  autoFocus?: boolean;
  mock?: boolean;
  data?: any;
};

export type MultiListPageProps<L = any, C = any> = PageCommonProps<L, C> & {
  createAccessReview?: {
    model: K8sKind;
    namespace?: string;
  };
  label?: string;
  hideTextFilter?: boolean;
  helpText?: React.ReactNode;
  resources: (Omit<FirehoseResource, 'prop'> & { prop?: FirehoseResource['prop'] })[];
  staticFilters?: { key: string; value: string }[];
  nameFilter?: string;
};

export const MultiListPage: React.FC<MultiListPageProps> = (props) => {
  const {
    autoFocus,
    canCreate,
    createAccessReview,
    createButtonText,
    createProps,
    filterLabel,
    nameFilterPlaceholder,
    labelFilterPlaceholder,
    flatten,
    helpText,
    label,
    ListComponent,
    mock,
    namespace,
    rowFilters,
    showTitle = true,
    staticFilters,
    textFilter,
    title,
    customData,
    badge,
    hideLabelFilter,
    hideNameLabelFilters,
    hideColumnManagement,
    columnLayout,
    nameFilter,
    data,
  } = props;
  const { t } = useTranslation();
  const resources = _.map(props.resources, (r) => ({
    ...r,
    isList: r.isList !== undefined ? r.isList : true,
    namespace: r.namespaced ? namespace : r.namespace,
    prop: r.kind,
  }));
  return (
    <FireMan
      autoFocus={autoFocus}
      canCreate={canCreate}
      createAccessReview={createAccessReview}
      createButtonText={createButtonText || t('public~Create')}
      createProps={createProps}
      filterLabel={filterLabel || t('public~by name')}
      helpText={helpText}
      resources={mock ? [] : resources}
      textFilter={textFilter}
      title={showTitle ? title : undefined}
      badge={badge}
    >
      <ListPropProvider data={data}>
        <ListPageWrapper
          flatten={flatten}
          kinds={_.map(resources, 'kind')}
          label={label}
          ListComponent={ListComponent}
          textFilter={textFilter}
          rowFilters={rowFilters}
          staticFilters={staticFilters}
          customData={customData}
          hideLabelFilter={hideLabelFilter}
          hideNameLabelFilters={hideNameLabelFilters}
          hideColumnManagement={hideColumnManagement}
          columnLayout={columnLayout}
          nameFilterPlaceholder={nameFilterPlaceholder}
          labelFilterPlaceholder={labelFilterPlaceholder}
          nameFilter={nameFilter}
          namespace={namespace}
          resources={data}
          data={data}
        />
      </ListPropProvider>
    </FireMan>
  );
};

MultiListPage.displayName = 'MultiListPage';
