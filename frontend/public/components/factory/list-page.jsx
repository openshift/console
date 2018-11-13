import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import k8sActions from '../../module/k8s/k8s-actions';
import { CheckBoxes, storagePrefix } from '../row-filter';
import { ErrorPage404, ErrorBoundaryFallback } from '../error';
import { referenceForModel } from '../../module/k8s';
import { withFallback } from '../utils/error-boundary';
import {
  Dropdown,
  Firehose,
  makeReduxID,
  makeQuery,
  history,
  inject,
  kindObj,
  PageHeading,
} from '../utils';

export const CompactExpandButtons = ({expand = false, onExpandChange = _.noop}) => <div className="btn-group btn-group-sm" data-toggle="buttons">
  <label className={classNames('btn compaction-btn', expand ? 'btn-default' : 'btn-primary')}>
    <input type="radio" onClick={() => onExpandChange(false)} /> Compact
  </label>
  <label className={classNames('btn compaction-btn', expand ? 'btn-primary' : 'btn-default')}>
    <input type="radio" onClick={() => onExpandChange(true)} /> Expand
  </label>
</div>;

/** @type {React.SFC<{autoFocus?: boolean, disabled?: boolean, label: string, onChange: React.ChangeEventHandler<any>, defaultValue: string}}>} */
export const TextFilter = ({label, onChange, defaultValue, style, className, autoFocus}) => {
  if (_.isUndefined(autoFocus)) {
    if (window.matchMedia('(min-width: 800px)').matches) {
      autoFocus = true;
    } else {
      // likely a mobile device, & autofocus will cause keyboard to pop up
      autoFocus = false;
    }
  }
  return <input
    autoCapitalize="none"
    autoFocus={autoFocus}
    className={classNames('form-control text-filter', className)}
    defaultValue={defaultValue}
    onChange={onChange}
    onKeyDown={e => e.key === 'Escape' && e.target.blur()}
    placeholder={`Filter ${label}...`}
    style={style}
    tabIndex={0}
    type="text"
  />;
};

TextFilter.displayName = 'TextFilter';

// TODO (jon) make this into "withListPageFilters" HOC
/** @augments {React.PureComponent<{ListComponent: React.ComponentType<any>, kinds: string[], flatten?: function, data?: any[], rowFilters?: any[]}>} */
export class ListPageWrapper_ extends React.PureComponent {
  render() {
    const {
      flatten,
      kinds,
      ListComponent,
      reduxIDs,
      rowFilters,
    } = this.props;
    const data = flatten ? flatten(this.props.resources) : [];

    const RowsOfRowFilters = rowFilters && _.map(rowFilters, ({items, reducer, selected, type, numbers}, i) => {
      const count = _.isFunction(numbers) ? numbers(data) : undefined;
      return <CheckBoxes
        key={i}
        applyFilter={this.props.applyFilter}
        items={_.isFunction(items) ? items(_.pick(this.props, kinds)) : items}
        numbers={count || _.countBy(data, reducer)}
        selected={selected}
        type={type}
        reduxIDs={reduxIDs}
      />;
    });

    return <div>
      <div className="row">
        {RowsOfRowFilters}
      </div>
      <div className="row">
        <div className="col-xs-12">
          <ListComponent {...this.props} data={data} />
        </div>
      </div>
    </div>;
  }
}

ListPageWrapper_.displayName = 'ListPageWrapper_';
ListPageWrapper_.propTypes = {
  data: PropTypes.array,
  kinds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])).isRequired,
  ListComponent: PropTypes.func.isRequired,
  rowFilters: PropTypes.array,
  staticFilters: PropTypes.array,
};

export const FireMan_ = connect(null, {filterList: k8sActions.filterList})(
  class ConnectedFireMan extends React.PureComponent {
    constructor(props) {
      super(props);
      this.onExpandChange = this.onExpandChange.bind(this);
      this.applyFilter = this.applyFilter.bind(this);

      const reduxIDs = props.resources.map(r => makeReduxID(kindObj(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)));
      this.state = { reduxIDs };
    }

    componentWillReceiveProps({resources}) {
      const reduxIDs = resources.map(r => makeReduxID(kindObj(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)));
      if (_.isEqual(reduxIDs, this.state.reduxIDs)) {
        return;
      }

      // reapply filters to the new list...
      // TODO (kans): we probably just need to be able to create new lists with filters already applied
      this.setState({ reduxIDs }, () => this.componentWillMount());
    }

    onExpandChange(expand) {
      this.setState({expand});
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
      this.state.reduxIDs.forEach(id => this.props.filterList(id, filterName, options));
      this.updateURL(filterName, options);
    }

    componentWillMount() {
      const params = new URLSearchParams(window.location.search);
      this.defaultValue = params.get(this.props.textFilter);
      params.forEach((v, k) => this.applyFilter(k, v));
    }

    render() {
      const {
        autoFocus,
        canCreate,
        canExpand,
        createButtonText,
        createProps,
        dropdownFilters,
        filterLabel,
        helpText,
        resources,
        textFilter,
      } = this.props;

      const DropdownFilters = dropdownFilters && dropdownFilters.map(({type, items, title}) => {
        return <Dropdown
          items={items}
          key={title}
          onChange={v => this.applyFilter(type, v)}
          title={title}
        />;
      });

      let createLink;
      if (canCreate) {
        if (createProps.to) {
          createLink = <Link className="co-m-primary-action" {...createProps} tabIndex={-1}>
            <button className="btn btn-primary" id="yaml-create" tabIndex={-1}>{createButtonText}</button>
          </Link>;
        } else if (createProps.items) {
          createLink = <div className="co-m-primary-action">
            <Dropdown buttonClassName="btn-primary" id="item-create" title={createButtonText} items={createProps.items} onChange={(name) => history.push(createProps.createLink(name))} />
          </div>;
        } else {
          createLink = <div className="co-m-primary-action">
            <button className="btn btn-primary" id="yaml-create" tabIndex={-1} {...createProps}>{createButtonText}</button>
          </div>;
        }
      }

      const {title} = this.props;
      return <React.Fragment>
        {title && <PageHeading title={title} />}
        <div className={classNames('co-m-pane__filter-bar', {'co-m-pane__filter-bar--with-help-text': helpText})}>
          {helpText && <div className={classNames('co-m-pane__filter-bar-group', {'co-m-pane__filter-bar-group--help-text': helpText})}>
            {helpText}
          </div>}
          {createLink && <div className="co-m-pane__filter-bar-group">
            {createLink}
          </div>}
          {canExpand && <div className="co-m-pane__filter-bar-group">
            <CompactExpandButtons expand={this.state.expand} onExpandChange={this.onExpandChange} />
          </div>}
          <div className={classNames('co-m-pane__filter-bar-group', DropdownFilters ? 'co-m-pane__filter-bar-group--filters' : 'co-m-pane__filter-bar-group--filter')}>
            {DropdownFilters && <div className="btn-group">
              {DropdownFilters}
            </div>}
            <TextFilter label={filterLabel} onChange={e => this.applyFilter(textFilter, e.target.value)} defaultValue={this.defaultValue} tabIndex={1} autoFocus={autoFocus} />
          </div>
        </div>
        <div className="co-m-pane__body">
          {inject(this.props.children, {
            resources,
            expand: this.state.expand,
            reduxIDs: this.state.reduxIDs,
          })}
        </div>
      </React.Fragment>;
    }
  }
);

FireMan_.displayName = 'FireMan';

FireMan_.defaultProps = {
  textFilter: 'name',
};

FireMan_.propTypes = {
  canCreate: PropTypes.bool,
  canExpand: PropTypes.bool,
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
    })
  ).isRequired,
  selectorFilterLabel: PropTypes.string,
  textFilter: PropTypes.string,
  title: PropTypes.string,
};

/** @type {React.SFC<{ListComponent: React.ComponentType<any>, kind: string, helpText?: any, namespace?: string, filterLabel?: string, textFilter?: string, title?: string, showTitle?: boolean, dropdownFilters?: any[], rowFilters?: any[], selector?: any, fieldSelector?: string, canCreate?: boolean, createButtonText?: string, createProps?: any, mock?: boolean}>} */
export const ListPage = withFallback(props => {
  const {
    autoFocus,
    canCreate,
    canExpand,
    createButtonText,
    createHandler,
    dropdownFilters,
    fieldSelector,
    filterLabel,
    filters,
    helpText,
    kind,
    limit,
    ListComponent,
    mock,
    name,
    namespace,
    selector,
    showTitle = true,
    textFilter,
  } = props;
  let { createProps } = props;
  const ko = kindObj(kind);
  const {
    label,
    labelPlural,
    namespaced,
    plural,
  } = ko;
  const title = props.title || labelPlural;
  let href = namespaced ? `/k8s/ns/${namespace || 'default'}/${plural}/new` : `/k8s/cluster/${plural}/new`;
  if (ko.crd) {
    try {
      const ref = referenceForModel(ko);
      href = namespaced ? `/k8s/ns/${namespace || 'default'}/${ref}/new` : `/k8s/cluster/${ref}/new`;
    } catch (unused) { /**/ }
  }

  createProps = createProps || (createHandler ? {onClick: createHandler} : {to: href});
  const resources = [{
    fieldSelector,
    filters,
    kind,
    limit,
    name,
    namespaced,
    selector,
  }];

  // Don't show row filters if props.filters were passed. The content is already filtered and the row filters will have incorrect counts.
  const rowFilters = _.isEmpty(filters) ? props.rowFilters : null;

  if (!namespaced && namespace) {
    return <ErrorPage404 />;
  }

  return <MultiListPage
    autoFocus={autoFocus}
    canCreate={canCreate}
    canExpand={canExpand}
    createButtonText={createButtonText || `Create ${label}`}
    createProps={createProps}
    dropdownFilters={dropdownFilters}
    filterLabel={filterLabel || `${labelPlural} by name`}
    flatten={_resources => _.get(_resources, (name || kind), {}).data}
    helpText={helpText}
    label={labelPlural}
    ListComponent={ListComponent}
    mock={mock}
    namespace={namespace}
    resources={resources}
    rowFilters={rowFilters}
    selectorFilterLabel="Filter by selector (app=nginx) ..."
    showTitle={showTitle}
    textFilter={textFilter}
    title={title}
  />;
}, ErrorBoundaryFallback);

ListPage.displayName = 'ListPage';

/** @type {React.SFC<{canCreate?: boolean, createButtonText?: string, createProps?: any, flatten?: Function, title?: string, showTitle?: boolean, helpText?: any, dropdownFilters?: any[], filterLabel?: string, rowFilters?: any[], resources: any[], ListComponent: React.ComponentType<any>, namespace?: string}>} */
export const MultiListPage = props => {
  const {
    autoFocus,
    canCreate,
    canExpand,
    createButtonText,
    createProps,
    dropdownFilters,
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
  } = props;

  const resources = _.map(props.resources, (r) => ({
    ...r,
    isList: true,
    namespace: r.namespaced ? namespace : r.namespace,
    prop: r.prop || r.kind,
  }));


  return <FireMan_
    autoFocus={autoFocus}
    canCreate={canCreate}
    canExpand={canExpand}
    createButtonText={createButtonText || 'Create'}
    createProps={createProps}
    dropdownFilters={dropdownFilters}
    filterLabel={filterLabel}
    helpText={helpText}
    resources={mock ? [] : resources}
    selectorFilterLabel="Filter by selector (app=nginx) ..."
    textFilter={textFilter}
    title={showTitle ? title : undefined}
  >
    <Firehose resources={mock ? [] : resources}>
      <ListPageWrapper_
        flatten={flatten}
        kinds={_.map(resources, 'kind')}
        label={label}
        ListComponent={ListComponent}
        mock={mock}
        rowFilters={rowFilters}
        staticFilters={staticFilters}
      />
    </Firehose>
  </FireMan_>;
};

MultiListPage.displayName = 'MultiListPage';
