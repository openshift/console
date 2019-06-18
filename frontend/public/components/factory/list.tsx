import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List as VirtualList,
  WindowScroller,
} from 'react-virtualized';

import * as UIActions from '../../actions/ui';
import { ingressValidHosts } from '../ingress';
import { alertStateOrder, silenceStateOrder } from '../../reducers/monitoring';
import {
  EmptyBox,
  LabelList,
  ResourceKebab,
  ResourceLink,
  resourcePath,
  Selector,
  StatusBox,
} from '../utils';
import {
  getJobTypeAndCompletions,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  planExternalName,
  podPhase,
  podReadiness,
  serviceCatalogStatus,
  serviceClassDisplayName,
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getTemplateInstanceStatus,
  getNodeRoles,
} from '../../module/k8s';

import { tableFilters } from './table-filters';

const rowFiltersToFilterFuncs = (rowFilters) => {
  return rowFilters
    .filter(f => f.type && _.isFunction(f.filter))
    .reduce((acc, f) => ({ ...acc, [f.type]: f.filter }), {});
};

const getAllTableFilters = (rowFilters = []) => ({
  ...tableFilters,
  ...rowFiltersToFilterFuncs(rowFilters),
});

const getFilteredRows = (_filters, rowFilters, objects) => {
  if (_.isEmpty(_filters)) {
    return objects;
  }

  const allTableFilters = getAllTableFilters(rowFilters);
  _.each(_filters, (value, name) => {
    const filter = allTableFilters[name];
    if (_.isFunction(filter)) {
      objects = _.filter(objects, o => filter(value, o));
    }
  });

  return objects;
};

const filterPropType = (props, propName, componentName) => {
  if (!props) {
    return;
  }

  const allTableFilters = getAllTableFilters(props.rowFilters);
  for (const key of _.keys(props[propName])) {
    if (key in allTableFilters || key === 'loadTest') {
      continue;
    }
    return new Error(`Invalid prop '${propName}' in '${componentName}'. '${key}' is not a valid filter type!`);
  }
};

const sorts = {
  alertStateOrder,
  daemonsetNumScheduled: daemonset => _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: resource => _.size(_.get(resource, 'data')),
  ingressValidHosts,
  serviceCatalogStatus,
  jobCompletions: job => getJobTypeAndCompletions(job).completions,
  jobType: job => getJobTypeAndCompletions(job).type,
  nodeReadiness: node => {
    let readiness = _.get(node, 'status.conditions');
    readiness = _.find(readiness, {type: 'Ready'});
    return _.get(readiness, 'status');
  },
  numReplicas: resource => _.toInteger(_.get(resource, 'status.replicas')),
  planExternalName,
  podPhase,
  podReadiness,
  serviceClassDisplayName,
  silenceStateOrder,
  string: val => JSON.stringify(val),
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getTemplateInstanceStatus,
  nodeRoles: (node: K8sResourceKind): string => {
    const roles = getNodeRoles(node);
    return roles.sort().join(', ');
  },
};

export class ColHead extends React.Component<ColHeadProps> {
  static propTypes = {
    applySort: PropTypes.func,
    children: PropTypes.string,
    className: PropTypes.string,
    currentSortField: PropTypes.string,
    currentSortFunc: PropTypes.string,
    currentSortOrder: PropTypes.string,
    sortField: PropTypes.string,
    sortFunc: PropTypes.string,
  };

  componentWillMount() {
    const {applySort, children, sortField, sortFunc} = this.props;

    const sp = new URLSearchParams(window.location.search);
    if (sp.get('sortBy') === children) {
      applySort(sortField, sortFunc, sp.get('orderBy') || 'asc', children);
    }
  }

  render() {
    // currentSortField/Func == info for currently sorted ColHead.
    // sortField/Func == this ColHead's field/func
    const {
      applySort,
      children,
      className,
      currentSortField,
      currentSortFunc,
      currentSortOrder,
      sortField,
      sortFunc,
    } = this.props;
    if (!sortField && !sortFunc) {
      return <div className={className}>{children}</div>;
    }

    const isSorted = sortField === currentSortField && sortFunc === currentSortFunc;
    const newSortOrder = isSorted && currentSortOrder === 'asc' ? 'desc' : 'asc';
    const onClick = () => applySort(sortField, sortFunc, newSortOrder, children);
    return <div className={className}>
      <a className={isSorted ? undefined : 'co-m-table-grid__sort-link--unsorted'} onClick={onClick}>{children}</a>
      {isSorted && <i className={`co-m-table-grid__sort-arrow fa fa-long-arrow-${currentSortOrder === 'asc' ? 'up' : 'down'}`}></i>}
    </div>;
  }
}

export const ListHeader: React.SFC = ({children}) => <div className="row co-m-table-grid__head">{children}</div>;
ListHeader.displayName = 'ListHeader';

export const WorkloadListHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortFunc="numReplicas">Status</ColHead>
  <ColHead {...props} className="col-lg-3 hidden-md hidden-sm hidden-xs" sortField="spec.selector">Pod Selector</ColHead>
</ListHeader>;

const getRowKey = (obj, index) => {
  return _.get(obj, 'rowKey') || _.get(obj, 'metadata.uid', index);
};

const VirtualRows: React.SFC<RowsProps> = (props) => {
  const { mock, label } = props;

  const measurementCache = new CellMeasurerCache({
    fixedWidth: true,
    minHeight: 44,
    keyMapper: rowIndex => `${_.get(props.data[rowIndex], 'metadata.uid', rowIndex)}-${props.expand ? 'expanded' : 'collapsed'}`,
  });

  const rowRenderer = ({index, style, key, parent}) => {
    const {data, expand, Row, kindObj} = props;
    const obj = data[index];

    return <CellMeasurer
      cache={measurementCache}
      columnIndex={0}
      key={key}
      parent={parent}
      rowIndex={index}>
      <div style={style} className="co-m-row">
        <Row key={getRowKey(obj, index)} obj={obj} expand={expand} kindObj={kindObj} index={index} />
      </div>
    </CellMeasurer>;
  };

  // Default `height` to 0 to avoid console errors from https://github.com/bvaughn/react-virtualized/issues/1158
  return <div className="co-m-table-grid__body">
    { mock
      ? <EmptyBox label={label} />
      : <WindowScroller scrollElement={document.getElementById('content-scrollable')}>
        {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
          <AutoSizer disableHeight>
            {({width}) => <div ref={registerChild}>
              <VirtualList
                autoHeight
                data={props.data}
                deferredMeasurementCache={measurementCache}
                expand={props.expand}
                height={height || 0}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                rowCount={props.data.length}
                rowHeight={measurementCache.rowHeight}
                rowRenderer={rowRenderer}
                scrollTop={scrollTop}
                tabIndex={null}
                width={width}
              />
            </div>}
          </AutoSizer>}
      </WindowScroller>
    }
  </div>;
};

VirtualRows.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  expand: PropTypes.bool,
  Row: PropTypes.func.isRequired,
  kindObj: PropTypes.any,
  label: PropTypes.string,
  mock: PropTypes.bool,
};

const Rows: React.SFC<RowsProps> = (props) => {
  const {Row, expand, kindObj} = props;

  return <div className="co-m-table-grid__body">
    { props.data.map((obj, i) => <div key={getRowKey(obj, i)} className="co-m-row">
      <Row obj={obj} expand={expand} kindObj={kindObj} />
    </div>) }
  </div>;
};

Rows.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  expand: PropTypes.bool,
  Row: PropTypes.func.isRequired,
  kindObj: PropTypes.any,
  label: PropTypes.string,
  mock: PropTypes.bool,
};

const skeletonTable = <div className="loading-skeleton--table" />;

const stateToProps = ({UI}, {data = [], defaultSortField = 'metadata.name', defaultSortFunc = undefined, filters = {}, loaded = false, reduxID = null, reduxIDs = null, staticFilters = [{}], rowFilters = []}) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  let newData = getFilteredRows(allFilters, rowFilters, data);

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;
  // Only default to 'metadata.name' if no `defaultSortFunc`
  const currentSortField = UI.getIn(['listSorts', listId, 'field'], defaultSortFunc ? undefined : defaultSortField);
  const currentSortFunc = UI.getIn(['listSorts', listId, 'func'], defaultSortFunc);
  const currentSortOrder = UI.getIn(['listSorts', listId, 'orderBy'], 'asc');

  if (loaded) {
    let sortBy: string | Function = 'metadata.name';
    if (currentSortField) {
      // Sort resources by one of their fields as a string
      sortBy = resource => sorts.string(_.get(resource, currentSortField, ''));
    } else if (currentSortFunc && sorts[currentSortFunc]) {
      // Sort resources by a function in the 'sorts' object
      sortBy = sorts[currentSortFunc];
    }

    // Always set the secondary sort criteria to ascending by name
    newData = _.orderBy(newData, [sortBy, 'metadata.name'], [currentSortOrder, 'asc']);
  }

  return {
    currentSortField,
    currentSortFunc,
    currentSortOrder,
    data: newData,
    listId,
  };
};

export const List = connect(stateToProps, {sortList: UIActions.sortList}, null, {
  areStatesEqual: ({UI: next}, {UI: prev}) => next.get('listSorts') === prev.get('listSorts'),
})(
  class ListInner extends React.Component<ListInnerProps> {
    static propTypes = {
      data: PropTypes.array,
      EmptyMsg: PropTypes.func,
      expand: PropTypes.bool,
      fieldSelector: PropTypes.string,
      filters: filterPropType,
      Header: PropTypes.func.isRequired,
      loaded: PropTypes.bool,
      loadError: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      mock: PropTypes.bool,
      namespace: PropTypes.string,
      reduxID: PropTypes.string,
      reduxIDs: PropTypes.array,
      Row: PropTypes.func.isRequired,
      selector: PropTypes.object,
      staticFilters: PropTypes.array,
      virtualize: PropTypes.bool,
      currentSortField: PropTypes.string,
      currentSortFunc: PropTypes.string,
      currentSortOrder: PropTypes.any,
      defaultSortField: PropTypes.string,
      defaultSortFunc: PropTypes.string,
      label: PropTypes.string,
      listId: PropTypes.string,
      sortList: PropTypes.func,
    };

    render() {
      const {currentSortField, currentSortFunc, currentSortOrder, expand, Header, label, listId, mock, Row, sortList, virtualize = true} = this.props;
      const componentProps: any = _.pick(this.props, ['data', 'filters', 'selected', 'match', 'kindObj']);
      const ListRows = virtualize ? VirtualRows : Rows;
      const children = <React.Fragment>
        <Header
          {...componentProps}
          applySort={_.partial(sortList, listId)}
          currentSortField={currentSortField}
          currentSortFunc={currentSortFunc}
          currentSortOrder={currentSortOrder}
          key="header"
        />
        <ListRows
          {...componentProps}
          expand={expand}
          key="rows"
          label={label}
          mock={mock}
          Row={Row}
        />
      </React.Fragment>;

      return <div className="co-m-table-grid co-m-table-grid--bordered">
        { mock ? children : <StatusBox skeleton={skeletonTable}{...this.props}>{children}</StatusBox> }
      </div>;
    }
  });

export class ResourceRow extends React.Component<ResourceRowProps> {
  shouldComponentUpdate(nextProps) {
    if (_.size(nextProps) !== _.size(this.props)) {
      return true;
    }
    for (const key of Object.keys(nextProps)) {
      if (key === 'obj') {
        const oldVersion = _.get(this.props.obj, 'metadata.resourceVersion');
        const newVersion = _.get(nextProps.obj, 'metadata.resourceVersion');
        if (!oldVersion || !newVersion || oldVersion !== newVersion) {
          return true;
        }
        continue;
      }
      if (nextProps[key] !== this.props[key]) {
        return true;
      }
    }
    return false;
  }

  render() {
    return <div className="row co-resource-list__item" style={this.props.style}>{this.props.children}</div>;
  }
}

export const WorkloadListRow: React.SFC<WorkloadListRowProps> = ({kind, actions, obj: o}) => <ResourceRow obj={o}>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
    <ResourceLink kind={kind} name={o.metadata.name} namespace={o.metadata.namespace} title={o.metadata.uid} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={o.metadata.namespace} title={o.metadata.namespace} />
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">
    <LabelList kind={kind} labels={o.metadata.labels} />
  </div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
    <Link to={`${resourcePath(kind, o.metadata.name, o.metadata.namespace)}/pods`} title="pods">
      {o.status.replicas || 0} of {o.spec.replicas} pods
    </Link>
  </div>
  <div className="col-lg-3 hidden-md hidden-sm hidden-xs">
    <Selector selector={o.spec.selector} namespace={o.metadata.namespace} />
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={actions} kind={kind} resource={o} />
  </div>
</ResourceRow>;

export type ColHeadProps = {
  applySort?: Function;
  children?: string;
  className?: string;
  currentSortField?: string;
  currentSortFunc?: string;
  currentSortOrder?: string;
  sortField?: string;
  sortFunc?: string;
};

export type ListInnerProps = {
  currentSortField?: string;
  currentSortFunc?: string;
  currentSortOrder?: any;
  data?: any[];
  defaultSortField?: string;
  defaultSortFunc?: string;
  EmptyMsg?: React.ComponentType<{}>;
  expand?: boolean;
  fieldSelector?: string;
  filters?: {[name: string]: any};
  Header: React.ComponentType<any>;
  label?: string;
  listId?: string;
  loaded?: boolean;
  loadError?: string | Object;
  mock?: boolean;
  namespace?: string;
  reduxID?: string;
  reduxIDs?: string[];
  Row: React.ComponentType<any>;
  selector?: Object;
  sortList?: (...args) => any;
  staticFilters?: any[];
  rowFilters?: any[];
  virtualize?: boolean;
};

export type ResourceRowProps = {
  obj: K8sResourceKind;
  style?: React.StyleHTMLAttributes<any>;
};

export type RowsProps = {
  data?: any[];
  expand?: boolean;
  kindObj?: K8sKind;
  label?: string;
  mock?: boolean;
  Row: React.ComponentType<any>;
};

export type WorkloadListRowProps = {
  actions: any;
  kind: K8sResourceKindReference;
  obj: K8sResourceKind;
};

Rows.displayName = 'Rows';
VirtualRows.displayName = 'VirtualRows';
WorkloadListRow.displayName = 'WorkloadListRow';
