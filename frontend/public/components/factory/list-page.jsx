import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';

import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { KEYBOARD_SHORTCUTS } from '@console/shared';
import { filterList } from '../../actions/k8s';
import { storagePrefix } from '../row-filter';
import { ErrorPage404, ErrorBoundaryFallback } from '../error';
import { referenceForModel } from '../../module/k8s';
import {
  Dropdown,
  Firehose,
  history,
  inject,
  kindObj,
  makeQuery,
  makeReduxID,
  PageHeading,
  RequireCreatePermission,
} from '../utils';
import { FilterToolbar } from '../filter-toolbar';

/** @type {React.SFC<{disabled?: boolean, label?: string, onChange: React.ChangeEventHandler<any>, defaultValue?: string, value?: string, placeholder?: string, autoFocus?: boolean,}}>} */
export const TextFilter = ({
  label,
  onChange,
  defaultValue,
  style,
  className,
  value,
  placeholder = `Filter ${label}...`,
  autoFocus = false,
}) => {
  const input = React.useRef();
  const onKeyDown = (e) => {
    const { nodeName } = e.target;
    if (
      nodeName === 'INPUT' ||
      nodeName === 'TEXTAREA' ||
      e.key !== KEYBOARD_SHORTCUTS.focusFilterInput
    ) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    input.current.focus();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="has-feedback">
      <input
        ref={input}
        autoCapitalize="none"
        className={classNames('pf-c-form-control co-text-filter', className)}
        data-test-id="item-filter"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onKeyDown={(e) => e.key === 'Escape' && e.target.blur()}
        placeholder={placeholder}
        style={style}
        tabIndex={0}
        type="text"
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
      <span className="form-control-feedback form-control-feedback--keyboard-hint">
        <kbd>/</kbd>
      </span>
    </div>
  );
};

TextFilter.displayName = 'TextFilter';

// TODO (jon) make this into "withListPageFilters" HOC
/** @augments {React.PureComponent<{ListComponent: React.ComponentType<any>, kinds: string[], filters?:any, flatten?: function, data?: any[], rowFilters?: any[], hideNameFilter?: boolean, hideLabelFilter?: boolean }>} */
export class ListPageWrapper_ extends React.PureComponent {
  render() {
    const {
      flatten,
      ListComponent,
      reduxIDs,
      rowFilters,
      textFilter,
      hideNameFilter,
      hideLabelFilter,
    } = this.props;
    const data = flatten ? flatten(this.props.resources) : [];
    const Filter = (
      <FilterToolbar
        rowFilters={rowFilters}
        data={data}
        reduxIDs={reduxIDs}
        textFilter={textFilter}
        hideNameFilter={hideNameFilter}
        hideLabelFilter={hideLabelFilter}
        {...this.props}
      />
    );

    return (
      <div>
        {!_.isEmpty(data) && Filter}
        <div className="row">
          <div className="col-xs-12">
            <ListComponent {...this.props} data={data} />
          </div>
        </div>
      </div>
    );
  }
}

ListPageWrapper_.displayName = 'ListPageWrapper_';
ListPageWrapper_.propTypes = {
  data: PropTypes.array,
  kinds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])).isRequired,
  ListComponent: PropTypes.elementType.isRequired,
  rowFilters: PropTypes.array,
  staticFilters: PropTypes.array,
  customData: PropTypes.any,
  hideNameFilter: PropTypes.bool,
  hideLabelFilter: PropTypes.bool,
};

/** @type {React.FC<<WrappedComponent>, {canCreate?: Boolean, textFilter:string, createAccessReview?: Object, createButtonText?: String, createProps?: Object, fieldSelector?: String, filterLabel?: String, resources: any, badge?: React.ReactNode}>*/
export const FireMan_ = connect(null, { filterList })(
  class ConnectedFireMan extends React.PureComponent {
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
      const url = new URL(window.location);
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
      this.defaultValue = params.get(this.props.textFilter);
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
            <Link className="co-m-primary-action" {...createProps}>
              <Button variant="primary" id="yaml-create">
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
              <Button variant="primary" id="yaml-create" {...createProps}>
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
              <div
                className={classNames('co-m-pane__createLink', {
                  'co-m-pane__createLink--no-title': !title,
                })}
              >
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

FireMan_.displayName = 'FireMan';

FireMan_.defaultProps = {
  textFilter: 'name',
};

FireMan_.propTypes = {
  canCreate: PropTypes.bool,
  createAccessReview: PropTypes.object,
  createButtonText: PropTypes.string,
  createProps: PropTypes.object,
  fieldSelector: PropTypes.string,
  filterLabel: PropTypes.string,
  helpText: PropTypes.any,
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      fieldSelector: PropTypes.string,
      filters: PropTypes.object,
      isList: PropTypes.bool,
      kind: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
      name: PropTypes.string,
      namespace: PropTypes.string,
      namespaced: PropTypes.bool,
      selector: PropTypes.shape({
        matchLabels: PropTypes.objectOf(PropTypes.string),
        matchExpressions: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
  ).isRequired,
  selectorFilterLabel: PropTypes.string,
  textFilter: PropTypes.string,
  title: PropTypes.string,
};

/** @type {React.SFC<{ListComponent: React.ComponentType<any>, kind: string, helpText?: any, namespace?: string, filterLabel?: string, textFilter?: string, title?: string, showTitle?: boolean, rowFilters?: any[], selector?: any, fieldSelector?: string, canCreate?: boolean, createButtonText?: string, createProps?: any, mock?: boolean, badge?: React.ReactNode, createHandler?: any, hideNameFilter?: boolean, hideLabelFilter?: boolean, customData?: any} >} */
export const ListPage = withFallback((props) => {
  const {
    autoFocus,
    canCreate,
    createButtonText,
    createHandler,
    customData,
    fieldSelector,
    filterLabel,
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
    hideNameFilter,
    hideLabelFilter,
  } = props;
  let { createProps } = props;
  const ko = kindObj(kind);
  const { label, labelPlural, namespaced, plural } = ko;
  const title = props.title || labelPlural;
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
      createButtonText={createButtonText || `Create ${label}`}
      createProps={createProps}
      customData={customData}
      filterLabel={filterLabel || 'by name'}
      flatten={(_resources) => _.get(_resources, name || kind, {}).data}
      helpText={helpText}
      label={labelPlural}
      ListComponent={ListComponent}
      mock={mock}
      namespace={usedNamespace}
      resources={resources}
      rowFilters={rowFilters}
      selectorFilterLabel="Filter by selector (app=nginx) ..."
      showTitle={showTitle}
      textFilter={textFilter}
      title={title}
      badge={badge}
      hideNameFilter={hideNameFilter}
      hideLabelFilter={hideLabelFilter}
    />
  );
}, ErrorBoundaryFallback);

ListPage.displayName = 'ListPage';

/** @type {React.SFC<{canCreate?: boolean, createButtonText?: string, createProps?: any, createAccessReview?: Object, flatten?: Function, title?: string, label?: string, hideTextFilter?: boolean, showTitle?: boolean, helpText?: any, filterLabel?: string, textFilter?: string, rowFilters?: any[], resources: any[], ListComponent: React.ComponentType<any>, namespace?: string, customData?: any, badge?: React.ReactNode, hideNameFilter?: boolean, hideLabelFilter?: boolean >} */
export const MultiListPage = (props) => {
  const {
    autoFocus,
    canCreate,
    createAccessReview,
    createButtonText,
    createProps,
    filterLabel,
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
    hideNameFilter,
    hideLabelFilter,
  } = props;

  const resources = _.map(props.resources, (r) => ({
    ...r,
    isList: r.isList !== undefined ? r.isList : true,
    namespace: r.namespaced ? namespace : r.namespace,
    prop: r.prop || r.kind,
  }));

  return (
    <FireMan_
      autoFocus={autoFocus}
      canCreate={canCreate}
      createAccessReview={createAccessReview}
      createButtonText={createButtonText || 'Create'}
      createProps={createProps}
      filterLabel={filterLabel || 'by name'}
      helpText={helpText}
      resources={mock ? [] : resources}
      selectorFilterLabel="Filter by selector (app=nginx) ..."
      textFilter={textFilter}
      title={showTitle ? title : undefined}
      badge={badge}
    >
      <Firehose resources={mock ? [] : resources}>
        <ListPageWrapper_
          flatten={flatten}
          kinds={_.map(resources, 'kind')}
          label={label}
          ListComponent={ListComponent}
          textFilter={textFilter}
          rowFilters={rowFilters}
          staticFilters={staticFilters}
          customData={customData}
          hideNameFilter={hideNameFilter}
          hideLabelFilter={hideLabelFilter}
        />
      </Firehose>
    </FireMan_>
  );
};

MultiListPage.displayName = 'MultiListPage';
