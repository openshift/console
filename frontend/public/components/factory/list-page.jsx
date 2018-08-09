import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';

import k8sActions from '../../module/k8s/k8s-actions';
import { CheckBoxes, storagePrefix } from '../row-filter';
import { Dropdown, Firehose, kindObj, NavTitle, history, inject, Disabled} from '../utils';
import { ErrorPage404 } from '../error';
import { makeReduxID, makeQuery } from '../utils/k8s-watcher';
import { referenceForModel } from '../../module/k8s';

export const CompactExpandButtons = ({expand = false, onExpandChange = _.noop}) => <div className="btn-group btn-group-sm" data-toggle="buttons">
  <label className={classNames('btn compaction-btn', expand ? 'btn-default' : 'btn-primary')}>
    <input type="radio" onClick={() => onExpandChange(false)} /> Compact
  </label>
  <label className={classNames('btn compaction-btn', expand ? 'btn-primary' : 'btn-default')}>
    <input type="radio" onClick={() => onExpandChange(true)} /> Expand
  </label>
</div>;

/** @type {React.SFC<{label: string, onChange: React.ChangeEventHandler<any>, defaultValue: string}}>} */
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
    type="text"
    autoCapitalize="none"
    style={style}
    className={classNames('form-control text-filter', className)}
    tabIndex={0}
    placeholder={`Filter ${label}...`}
    onChange={onChange}
    autoFocus={autoFocus}
    defaultValue={defaultValue}
    onKeyDown={e => e.key === 'Escape' && e.target.blur()}
  />;
};

TextFilter.displayName = 'TextFilter';

/** @augments {React.PureComponent<{ListComponent: React.ComponentType<any>, kinds: string[], flatten?: function, data?: any[], rowFilters?: any[]}>} */
export class ListPageWrapper_ extends React.PureComponent {
  render () {
    const {kinds, ListComponent, rowFilters, reduxIDs, flatten} = this.props;
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
    constructor (props) {
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

    onExpandChange (expand) {
      this.setState({expand});
    }

    updateURL (filterName, options) {
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

    applyFilter (filterName, options) {
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

    componentWillMount () {
      const params = new URLSearchParams(window.location.search);
      this.defaultValue = params.get(this.props.textFilter);
      params.forEach((v, k) => this.applyFilter(k, v));
    }

    render () {
      const {createButtonText, dropdownFilters, textFilter, filterLabel, canExpand, canCreate, createProps, autoFocus, resources} = this.props;

      const DropdownFilters = dropdownFilters && dropdownFilters.map(({type, items, title}) => {
        return <Dropdown key={title} items={items} title={title} onChange={v => this.applyFilter(type, v)} />;
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
        {title && <NavTitle title={title} />}
        <div className="co-m-pane__filter-bar">
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
  createProps: PropTypes.object,
  createButtonText: PropTypes.string,
  fieldSelector: PropTypes.string,
  selectorFilterLabel: PropTypes.string,
  filterLabel: PropTypes.string,
  textFilter: PropTypes.string,
  title: PropTypes.string,
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      kind: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
      selector: PropTypes.shape({
        matchLabels: PropTypes.objectOf(PropTypes.string),
        matchExpressions: PropTypes.arrayOf(PropTypes.object),
      }),
      fieldSelector: PropTypes.string,
      namespace: PropTypes.string,
      name: PropTypes.string,
      isList: PropTypes.bool,
      namespaced: PropTypes.bool,
      filters: PropTypes.object,
    })
  ).isRequired,
};

/** @type {React.SFC<{ListComponent: React.ComponentType<any>, kind: string, namespace?: string, filterLabel?: string, title?: string, showTitle?: boolean, dropdownFilters?: any[], rowFilters?: any[], selector?: any, fieldSelector?: string, canCreate?: boolean, createButtonText?: string, createProps?: any, fake?: boolean}>} */
export const ListPage = props => {
  const {createButtonText, createHandler, filterLabel, kind, namespace, selector, name, fieldSelector, filters, limit, showTitle = true, fake} = props;
  let { createProps } = props;
  const ko = kindObj(kind);
  const {labelPlural, plural, namespaced, label} = ko;
  const title = props.title || labelPlural;
  let href = namespaced ? `/k8s/ns/${namespace || 'default'}/${plural}/new` : `/k8s/cluster/${plural}/new`;
  if (ko.crd) {
    try {
      const ref = referenceForModel(ko);
      href = namespaced ? `/k8s/ns/${namespace || 'default'}/${ref}/new` : `/k8s/cluster/${ref}/new`;
    } catch (unused) { /**/ }
  }

  createProps = createProps || (createHandler ? {onClick: createHandler} : {to: href});
  const resources = [{ kind, name, namespaced, selector, fieldSelector, filters, limit }];

  // Don't show row filters if props.filters were passed. The content is already filtered and the row filters will have incorrect counts.
  const rowFilters = _.isEmpty(filters) ? props.rowFilters : null;

  if (!namespaced && namespace) {
    return <ErrorPage404 />;
  }

  return <MultiListPage
    filterLabel={filterLabel || `${labelPlural} by name`}
    selectorFilterLabel="Filter by selector (app=nginx) ..."
    createProps={createProps}
    title={title}
    showTitle={showTitle}
    canCreate={props.canCreate}
    canExpand={props.canExpand}
    createButtonText={createButtonText || `Create ${label}`}
    textFilter={props.textFilter}
    resources={resources}
    autoFocus={props.autoFocus}
    dropdownFilters={props.dropdownFilters}
    ListComponent={props.ListComponent}
    rowFilters={rowFilters}
    label={labelPlural}
    flatten={_resources => _.get(_resources, (name || kind), {}).data}
    namespace={namespace}
    fake={fake}
  />;
};

ListPage.displayName = 'ListPage';

/** @type {React.SFC<{canCreate?: boolean, createButtonText?: string, createProps?: any, flatten?: Function, title?: string, showTitle?: boolean, dropdownFilters?: any[], filterLabel?: string, rowFilters?: any[], resources: any[], ListComponent: React.ComponentType<any>, namespace?: string}>} */
export const MultiListPage = props => {
  const {createButtonText, flatten, filterLabel, createProps, showTitle = true, title, namespace, fake} = props;
  const resources = _.map(props.resources, (r) => ({
    ...r,
    isList: true,
    prop: r.prop || r.kind,
    namespace: r.namespaced ? namespace : r.namespace,
  }));

  const elems = <FireMan_
    filterLabel={filterLabel}
    selectorFilterLabel="Filter by selector (app=nginx) ..."
    createProps={createProps}
    title={showTitle ? title : undefined}
    canCreate={props.canCreate}
    canExpand={props.canExpand}
    createButtonText={createButtonText || 'Create'}
    textFilter={props.textFilter}
    resources={resources}
    autoFocus={fake ? false: props.autoFocus}
    dropdownFilters={props.dropdownFilters}
  >
    <Firehose resources={resources}>
      <ListPageWrapper_ ListComponent={props.ListComponent} kinds={_.map(resources, 'kind')} rowFilters={props.rowFilters} staticFilters={props.staticFilters} flatten={flatten} label={props.label} fake={fake} />
    </Firehose>
  </FireMan_>;
  return fake ? <Disabled>{elems}</Disabled> : elems;
};

MultiListPage.displayName = 'MultiListPage';
