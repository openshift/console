import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link, match as RMatch } from 'react-router-dom';
import { Button, TextInput, TextInputProps } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { useDocumentListener, KEYBOARD_SHORTCUTS } from '@console/shared';

import { filterList } from '../../actions/k8s';
import { storagePrefix } from '../row-filter';
import { ErrorPage404, ErrorBoundaryFallback } from '../error';
import { K8sKind, K8sResourceCommon, referenceForModel, Selector } from '../../module/k8s';
import {
  Dropdown,
  Firehose,
  FirehoseResource,
  FirehoseResourcesResult,
  FirehoseResultObject,
  FirehoseResult,
  history,
  inject,
  kindObj,
  makeQuery,
  makeReduxID,
  PageHeading,
  RequireCreatePermission,
} from '../utils';
import { FilterToolbar, RowFilter } from '../filter-toolbar';
import { ColumnLayout } from '../modals/column-management-modal';

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
  parentClassName?: string;
};

export const TextFilter: React.FC<TextFilterProps> = (props) => {
  const {
    label,
    className,
    placeholder,
    autoFocus = false,
    parentClassName,
    ...otherInputProps
  } = props;
  const { ref } = useDocumentListener<HTMLInputElement>();
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t('public~Filter {{label}}...', { label });

  return (
    <div className={classNames('has-feedback', parentClassName)}>
      <TextInput
        {...otherInputProps}
        className={classNames('co-text-filter', className)}
        data-test-id="item-filter"
        aria-label={placeholderText}
        placeholder={placeholderText}
        ref={ref}
        autoFocus={autoFocus}
        tabIndex={0}
        type="text"
      />
      <span className="form-control-feedback form-control-feedback--keyboard-hint">
        <kbd>{KEYBOARD_SHORTCUTS.focusFilterInput}</kbd>
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
  labelFilterPlaceholder?: string;
  label?: string;
  staticFilters?: { key: string; value: string }[];
  customData?: C;
  hideColumnManagement?: boolean;
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
    resources,
  } = props;
  const data = flatten ? flatten(resources) : [];
  const Filter = (
    <FilterToolbar
      rowFilters={rowFilters}
      data={data}
      nameFilterPlaceholder={nameFilterPlaceholder}
      labelFilterPlaceholder={labelFilterPlaceholder}
      reduxIDs={reduxIDs}
      textFilter={textFilter}
      hideNameLabelFilters={hideNameLabelFilters}
      hideLabelFilter={hideLabelFilter}
      columnLayout={columnLayout}
      uniqueFilterName={name}
      {...props}
    />
  );

  return (
    <div>
      {!_.isEmpty(data) && Filter}
      <div className="row">
        <div className="col-xs-12">
          <ListComponent {...props} data={data} />
        </div>
      </div>
    </div>
  );
};

ListPageWrapper.displayName = 'ListPageWrapper_';

export type FireManProps = {
  canCreate?: boolean;
  textFilter: string;
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
  title: string;
  autoFocus?: boolean;
};

type FireManState = {
  reduxIDs: string[];
  expand?: boolean;
};

export const FireMan = connect<{}, { filterList: typeof filterList }, FireManProps, FireManState>(
  null,
  { filterList },
)(
  class ConnectedFireMan extends React.PureComponent<
    FireManProps & { filterList: typeof filterList },
    FireManState
  > {
    constructor(props) {
      super(props);
      this.onExpandChange = this.onExpandChange.bind(this);
      this.applyFilter = this.applyFilter.bind(this);

      const reduxIDs = props.resources.map((r) =>
        makeReduxID(kindObj(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)),
      );
      this.state = { reduxIDs };
    }

    UNSAFE_componentWillReceiveProps({ resources }) {
      const reduxIDs = resources.map((r) =>
        makeReduxID(kindObj(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)),
      );
      if (_.isEqual(reduxIDs, this.state.reduxIDs)) {
        return;
      }

      // reapply filters to the new list...
      // TODO (kans): we probably just need to be able to create new lists with filters already applied
      this.setState({ reduxIDs }, () => this.UNSAFE_componentWillMount());
    }

    onExpandChange(expand) {
      this.setState({ expand });
    }

    updateURL(filterName, options) {
      if (filterName !== this.props.textFilter) {
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
      history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
    }

    applyFilter(filterName, options) {
      // TODO: (ggreer) lame blacklist of query args. Use a whitelist based on resource filters
      if (['q', 'kind', 'orderBy', 'sortBy'].includes(filterName)) {
        return;
      }
      if (filterName.indexOf(storagePrefix) === 0) {
        return;
      }
      this.state.reduxIDs.forEach((id) => this.props.filterList(id, filterName, options));
      this.updateURL(filterName, options);
    }

    UNSAFE_componentWillMount() {
      const params = new URLSearchParams(window.location.search);
      params.forEach((v, k) => this.applyFilter(k, v));
    }

    runOrNavigate = (itemName) => {
      const { createProps = {} } = this.props;
      const action = _.isFunction(createProps.action) && createProps.action(itemName);
      if (action) {
        action();
      } else if (_.isFunction(createProps.createLink)) {
        history.push(createProps.createLink(itemName));
      }
    };

    render() {
      const {
        canCreate,
        createAccessReview,
        createButtonText,
        createProps = {},
        helpText,
        resources,
        badge,
        title,
      } = this.props;

      let createLink;
      if (canCreate) {
        if (createProps.to) {
          createLink = (
            <Link className="co-m-primary-action" to={createProps.to}>
              <Button variant="primary" id="yaml-create" data-test="item-create">
                {createButtonText}
              </Button>
            </Link>
          );
        } else if (createProps.items) {
          createLink = (
            <div className="co-m-primary-action">
              <Dropdown
                buttonClassName="pf-m-primary"
                id="item-create"
                dataTest="item-create"
                menuClassName={classNames({ 'pf-m-align-right-on-md': title })}
                title={createButtonText}
                noSelection
                items={createProps.items}
                onChange={this.runOrNavigate}
              />
            </div>
          );
        } else {
          createLink = (
            <div className="co-m-primary-action">
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
          {/* Badge rendered from PageHeading only when title is present */}
          <PageHeading
            title={title}
            badge={title ? badge : null}
            className={classNames({ 'co-m-nav-title--row': createLink })}
          >
            {createLink && (
              <div className={classNames({ 'co-m-pane__createLink--no-title': !title })}>
                {createLink}
              </div>
            )}
            {!title && badge && <div>{badge}</div>}
          </PageHeading>
          {helpText && <p className="co-m-pane__help-text co-help-text">{helpText}</p>}
          <div className="co-m-pane__body co-m-pane__body--no-top-margin">
            {inject(this.props.children, {
              resources,
              expand: this.state.expand,
              reduxIDs: this.state.reduxIDs,
              applyFilter: this.applyFilter,
            })}
          </div>
        </>
      );
    }
  },
);
FireMan.displayName = 'FireMan';

export type Flatten<
  F extends FirehoseResultObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] },
  R = any
> = (resources: FirehoseResourcesResult<F>) => R;

type ListPageProps<L = any, C = any> = PageCommonProps<L, C> & {
  kind: string;
  helpText?: React.ReactNode;
  selector?: Selector;
  fieldSelector?: string;
  createHandler?: () => void;
  name?: string;
  filters?: any;
  limit?: number;
  nameFilter?: string;
  match?: RMatch<any>;
  skipAccessReview?: boolean;
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
    match,
    badge,
    hideLabelFilter,
    hideNameLabelFilters,
    hideColumnManagement,
    columnLayout,
    flatten = (_resources) => _.get(_resources, name || kind, {} as FirehoseResult).data,
  } = props;
  const { t } = useTranslation();
  let { createProps } = props;
  const ko = kindObj(kind);
  const { label, labelKey, labelPlural, labelPluralKey, namespaced, plural } = ko;
  const title = props.title || t(labelPluralKey) || labelPlural;
  const usedNamespace = !namespace && namespaced ? _.get(match, 'params.ns') : namespace;

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
      name: name || nameFilter,
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
    />
  );
}, ErrorBoundaryFallback);

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
};

type MultiListPageProps<L = any, C = any> = PageCommonProps<L, C> & {
  createAccessReview?: {
    model: K8sKind;
    namespace?: string;
  };
  label?: string;
  hideTextFilter?: boolean;
  helpText?: React.ReactNode;
  resources: (Omit<FirehoseResource, 'prop'> & { prop?: FirehoseResource['prop'] })[];
  staticFilters?: { key: string; value: string }[];
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
  } = props;

  const { t } = useTranslation();
  const resources = _.map(props.resources, (r) => ({
    ...r,
    isList: r.isList !== undefined ? r.isList : true,
    namespace: r.namespaced ? namespace : r.namespace,
    prop: r.prop || r.kind,
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
      <Firehose resources={mock ? [] : resources}>
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
        />
      </Firehose>
    </FireMan>
  );
};

MultiListPage.displayName = 'MultiListPage';
