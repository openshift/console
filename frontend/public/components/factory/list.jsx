import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AutoSizer, List as VirtualList, WindowScroller, CellMeasurerCache, CellMeasurer } from 'react-virtualized';

import { getJobTypeAndCompletions, isNodeReady, podPhase, podReadiness } from '../../module/k8s';
import { isScanned, isSupported, makePodvuln, numFixables } from '../../module/k8s/podvulns';
import { UIActions } from '../../ui/ui-actions';
import { ingressValidHosts } from '../ingress';
import { bindingType, roleType } from '../RBAC';
import { LabelList, ResourceCog, ResourceLink, resourcePath, Selector, StatusBox, containerLinuxUpdateOperator } from '../utils';
import { routeStatus } from '../routes';

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

    const phase = podPhase(pod);
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },

  'node-status': (status, node) => {
    const isReady = isNodeReady(node);
    return status === 'all' || (status === 'ready' && isReady) || (status === 'notReady' && !isReady);
  },

  'podvuln-filter': (filters, pod) => {
    if (!filters || !filters.selected || !filters.selected.size) {
      return true;
    }
    const podvuln = makePodvuln(pod);

    const fixables = numFixables(podvuln);
    const scanned = isScanned(podvuln);
    const supported = isSupported(podvuln);
    const P0 = _.get(pod, 'metadata.labels.secscan/P0');
    const P1 = _.get(pod, 'metadata.labels.secscan/P1');
    const P2 = _.get(pod, 'metadata.labels.secscan/P2');
    const P3 = _.get(pod, 'metadata.labels.secscan/P3');

    return filters.selected.has('P0') && P0 ||
           filters.selected.has('P1') && P1 ||
           filters.selected.has('P2') && P2 ||
           filters.selected.has('P3') && P3 ||
           filters.selected.has('Fixables') && (fixables ? true : false) ||
           filters.selected.has('NotScanned') && (!scanned || !supported) ||
           filters.selected.has('Passed') && !P0 && !P1 && !P2 && !P3 && isSupported(podvuln);
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
    const type = secret.type;
    return types.selected.has(type) || !_.includes(types.all, type);
  }
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

/** @augments {React.Component<any>} */
export class ColHead extends React.Component {
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

ColHead.propTypes = {
  applySort: PropTypes.func,
  children: PropTypes.string,
  className: PropTypes.string,
  currentSortField: PropTypes.string,
  currentSortFunc: PropTypes.string,
  currentSortOrder: PropTypes.string,
  sortField: PropTypes.string,
  sortFunc: PropTypes.string,
};

export const ListHeader = ({children}) => <div className="row co-m-table-grid__head">{children}</div>;
ListHeader.displayName = 'ListHeader';

export const WorkloadListHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortFunc="numReplicas">Status</ColHead>
  <ColHead {...props} className="col-lg-3 hidden-md hidden-sm hidden-xs" sortField="spec.selector">Pod Selector</ColHead>
</ListHeader>;

export class Rows extends React.Component {
  constructor(props) {
    super(props);

    this.measurementCache = new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 50,
    });

    this.rowRenderer = this._rowRenderer.bind(this);
  }

  _rowRenderer({index, style, key, parent}) {
    const {data, expand, Row, kindObj} = this.props;

    return (
      <CellMeasurer
        cache={this.measurementCache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}>
        <div style={style}>
          <Row key={key} obj={data[index]} expand={expand} kindObj={kindObj} index={index} />
        </div>
      </CellMeasurer>
    );
  }

  render () {
    const data = this.props.data;
    return <div className="co-m-table-grid__body">
      <WindowScroller>
        {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
          <AutoSizer disableHeight>
            {({width}) => <div ref={registerChild}>
              <VirtualList
                autoHeight
                data={data}
                height={height}
                deferredMeasurementCache={this.measurementCache}
                rowHeight={this.measurementCache.rowHeight}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                rowRenderer={this.rowRenderer}
                rowCount={data.length}
                scrollTop={scrollTop}
                width={width}
                tabIndex={null}
              />
            </div>}
          </AutoSizer> }
      </WindowScroller>
    </div>;
  }
}

Rows.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  expand: PropTypes.bool,
  Row: PropTypes.func.isRequired,
};

const stateToProps = ({UI}, {data, filters, loaded, reduxID, reduxIDs, staticFilters}) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  let newData = getFilteredRows(allFilters, data);

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;
  const currentSortField = UI.getIn(['listSorts', listId, 'field'], 'metadata.name');
  const currentSortFunc = UI.getIn(['listSorts', listId, 'func']);
  const currentSortOrder = UI.getIn(['listSorts', listId, 'orderBy'], 'asc');

  if (loaded) {
    let sortBy = 'metadata.name';
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
  /** @param props {{Header: React.ComponentType, Row: React.ComponentType, data: any[]}} */
  function ListInner (props) {
    const {currentSortField, currentSortFunc, currentSortOrder, expand, Header, listId, Row, sortList, fake} = props;
    const componentProps = _.pick(props, ['data', 'filters', 'selected', 'match', 'kindObj']);

    const childrens = [
      <Header
        key="header"
        applySort={_.partial(sortList, listId)}
        currentSortField={currentSortField}
        currentSortFunc={currentSortFunc}
        currentSortOrder={currentSortOrder}
        {...componentProps}
      />,
      <Rows key="rows" expand={expand} Row={Row} {...componentProps} />
    ];

    return <div className="co-m-table-grid co-m-table-grid--bordered">
      {fake ? childrens : <StatusBox {...props}>{childrens}</StatusBox> }
    </div>;
  });

List.propTypes = {
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

/** @augments {React.Component<{obj: any>}} */
export class ResourceRow extends React.Component {
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

export const WorkloadListRow = ({kind, actions, obj: o, style}) => <ResourceRow obj={o} style={style}>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
    <ResourceCog actions={actions} kind={kind} resource={o} />
    <ResourceLink kind={kind} name={o.metadata.name} namespace={o.metadata.namespace} title={o.metadata.uid} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
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
    <Selector selector={o.spec.selector} />
  </div>
</ResourceRow>;
