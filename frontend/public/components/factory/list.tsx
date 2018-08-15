/* eslint-disable no-undef */

import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AutoSizer, List as VirtualList, WindowScroller, CellMeasurerCache, CellMeasurer } from 'react-virtualized';

import { getJobTypeAndCompletions, isNodeReady, podPhase, podPhaseFilterReducer, podReadiness, K8sResourceKind, K8sKind, K8sResourceKindReference } from '../../module/k8s';
import { UIActions } from '../../ui/ui-actions';
import { ingressValidHosts } from '../ingress';
import { routeStatus } from '../routes';
import { secretTypeFilterReducer } from '../secret';
import { bindingType, roleType } from '../RBAC';
import { LabelList, ResourceCog, ResourceLink, resourcePath, Selector, StatusBox, containerLinuxUpdateOperator, EmptyBox } from '../utils';

const fuzzyCaseInsensitive = (a, b) => fuzzy(_.toLower(a), _.toLower(b));

// TODO: Having list filters here is undocumented, stringly-typed, and non-obvious. We can change that
const listFilters = {
  'name': (filter, obj) => fuzzyCaseInsensitive(filter, obj.metadata.name),

  // Filter role by role kind
  'role-kind': (filter, role) => filter.selected.has(roleType(role)),

  // Filter role bindings by role kind
  'role-binding-kind': (filter, binding) => filter.selected.has(bindingType(binding)),

  // Filter role bindings by text match
  'role-binding': (str, {metadata, roleRef, subject}) => {
    const isMatch = val => fuzzyCaseInsensitive(str, val);
    return [metadata.name, roleRef.name, subject.kind, subject.name].some(isMatch);
  },

  // Filter role bindings by roleRef name
  'role-binding-roleRef': (roleRef, binding) => binding.roleRef.name === roleRef,

  'selector': (selector, obj) => {
    if (!selector || !selector.values || !selector.values.size) {
      return true;
    }
    return selector.values.has(_.get(obj, selector.field));
  },

  'pod-status': (phases, pod) => {
    if (!phases || !phases.selected || !phases.selected.size) {
      return true;
    }

    const phase = podPhaseFilterReducer(pod);
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },

  'node-status': (status, node) => {
    const isReady = isNodeReady(node);
    return status === 'all' || (status === 'ready' && isReady) || (status === 'notReady' && !isReady);
  },

  'clusterserviceversion-resource-kind': (filters, resource) => {
    if (!filters || !filters.selected || !filters.selected.size) {
      return true;
    }
    return filters.selected.has(resource.kind);
  },

  'build-status': (phases, build) => {
    if (!phases || !phases.selected || !phases.selected.size) {
      return true;
    }

    const phase = build.status.phase;
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },

  'build-strategy': (strategies, buildConfig) => {
    if (!strategies || !strategies.selected || !strategies.selected.size) {
      return true;
    }

    const strategy = buildConfig.spec.strategy.type;
    return strategies.selected.has(strategy) || !_.includes(strategies.all, strategy);
  },

  'route-status': (statuses, route) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    let status = routeStatus(route);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },

  'secret-type': (types, secret) => {
    if (!types || !types.selected || !types.selected.size) {
      return true;
    }
    const type = secretTypeFilterReducer(secret);
    return types.selected.has(type) || !_.includes(types.all, type);
  },

  'pvc-status': (phases, pvc) => {
    if (!phases || !phases.selected || !phases.selected.size) {
      return true;
    }

    const phase = pvc.status.phase;
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },
};

const getFilteredRows = (_filters, objects) => {
  if (_.isEmpty(_filters)) {
    return objects;
  }

  _.each(_filters, (value, name) => {
    const filter = listFilters[name];
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

  for (let key of _.keys(props[propName])) {
    if (key in listFilters || key === 'loadTest') {
      continue;
    }
    return new Error(`Invalid prop '${propName}' in '${componentName}'. '${key}' is not a valid filter type!`);
  }
};

const sorts = {
  daemonsetNumScheduled: daemonset => _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: resource => _.size(_.get(resource, 'data')),
  ingressValidHosts,
  jobCompletions: job => getJobTypeAndCompletions(job).completions,
  jobType: job => getJobTypeAndCompletions(job).type,
  nodeReadiness: node => {
    let readiness = _.get(node, 'status.conditions');
    readiness = _.find(readiness, {type: 'Ready'});
    return _.get(readiness, 'status');
  },
  nodeUpdateStatus: node => _.get(containerLinuxUpdateOperator.getUpdateStatus(node), 'text'),
  numReplicas: resource => _.toInteger(_.get(resource, 'status.replicas')),
  podPhase,
  podReadiness,
  string: val => JSON.stringify(val),
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

  render () {
    // currentSortField/Func == info for currently sorted ColHead.
    // sortField/Func == this ColHead's field/func
    const {applySort, children, currentSortField, currentSortFunc, currentSortOrder, sortField, sortFunc} = this.props;
    const className = classNames(this.props.className, 'text-nowrap');
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

export const Rows: React.SFC<RowsProps> = (props) => {
  const { fake, label } = props;
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
      rowIndex={index}
      parent={parent}>
      <div style={style}>
        <Row key={_.get(obj, 'metadata.uid', index)} obj={obj} expand={expand} kindObj={kindObj} index={index} />
      </div>
    </CellMeasurer>;
  };

  return <div className="co-m-table-grid__body">
    { fake
      ? <EmptyBox label={label} />
      : <WindowScroller>
        {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
          <AutoSizer disableHeight>
            {({width}) => <div ref={registerChild}>
              <VirtualList
                autoHeight
                data={props.data}
                expand={props.expand}
                height={height}
                deferredMeasurementCache={measurementCache}
                rowHeight={measurementCache.rowHeight}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                rowRenderer={rowRenderer}
                rowCount={props.data.length}
                scrollTop={scrollTop}
                width={width}
                tabIndex={null}
              />
            </div>}
          </AutoSizer>}
      </WindowScroller>
    }
  </div>;
};

Rows.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  expand: PropTypes.bool,
  Row: PropTypes.func.isRequired,
};

const stateToProps = ({UI}, {data = [], filters = {}, loaded = false, reduxID = null, reduxIDs = null, staticFilters = [{}]}) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  let newData = getFilteredRows(allFilters, data);

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;
  const currentSortField = UI.getIn(['listSorts', listId, 'field'], 'metadata.name');
  const currentSortFunc = UI.getIn(['listSorts', listId, 'func']);
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

  return {currentSortField, currentSortFunc, currentSortOrder, data: newData, listId};
};

export const List = connect(stateToProps, {sortList: UIActions.sortList})(
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
      namespace: PropTypes.string,
      reduxID: PropTypes.string,
      reduxIDs: PropTypes.array,
      Row: PropTypes.func.isRequired,
      selector: PropTypes.object,
      staticFilters: PropTypes.array,
      fake: PropTypes.bool,
    };

    render() {
      const {currentSortField, currentSortFunc, currentSortOrder, expand, Header, label, listId, Row, sortList, fake} = this.props;
      const componentProps: any = _.pick(this.props, ['data', 'filters', 'selected', 'match', 'kindObj']);

      const children = <React.Fragment>
        <Header
          key="header"
          applySort={_.partial(sortList, listId)}
          currentSortField={currentSortField}
          currentSortFunc={currentSortFunc}
          currentSortOrder={currentSortOrder}
          {...componentProps}
        />
        <Rows key="rows" expand={expand} Row={Row} fake={fake} label={label} {...componentProps} />
      </React.Fragment>;

      return <div className="co-m-table-grid co-m-table-grid--bordered">
        { fake ? children : <StatusBox {...this.props}>{children}</StatusBox> }
      </div>;
    }
  });

export class ResourceRow extends React.Component<ResourceRowProps> {
  shouldComponentUpdate(nextProps) {
    if (_.size(nextProps) !== _.size(this.props)) {
      return true;
    }
    for (let key of Object.keys(nextProps)) {
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

  render () {
    return <div className="row co-resource-list__item" style={this.props.style}>{this.props.children}</div>;
  }
}

export const WorkloadListRow: React.SFC<WorkloadListRowProps> = ({kind, actions, obj: o}) => <ResourceRow obj={o}>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={actions} kind={kind} resource={o} />
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
  Header: React.ComponentType<any>;
  Row: React.ComponentType<any>;
  data?: any[];
  label?: string;
  EmptyMsg?: React.ComponentType<{}>;
  expand?: boolean;
  fieldSelector?: string;
  filters?: {[name: string]: any};
  loaded?: boolean;
  loadError?: string | Object;
  namespace?: string;
  reduxID?: string;
  reduxIDs?: string[];
  selector?: Object;
  staticFilters?: any[];
  fake?: boolean;
  currentSortField?: string;
  currentSortFunc?: Function;
  currentSortOrder?: any;
  listId?: string;
  sortList?: (...args) => any;
};

export type ResourceRowProps = {
  obj: K8sResourceKind;
  style?: React.StyleHTMLAttributes<any>;
};

export type RowsProps = {
  data?: any[];
  expand?: boolean;
  fake?: boolean;
  label?: string;
  Row: React.ComponentType<any>;
  kindObj?: K8sKind;
};

export type WorkloadListRowProps = {
  kind: K8sResourceKindReference;
  actions: any;
  obj: K8sResourceKind;
};

Rows.displayName = 'Rows';
WorkloadListRow.displayName = 'WorkloadListRow';
