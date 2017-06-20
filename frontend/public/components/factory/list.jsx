import React from 'react';
import fuzzy from 'fuzzysearch';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { getQN, isNodeReady } from '../../module/k8s';
import { UIActions } from '../../ui/ui-actions';
import { ingressValidHosts } from '../ingress';
import { bindingType, roleType } from '../RBAC';
import { LabelList, podPhase, podReadiness, ResourceCog, ResourceLink, resourcePath, Selector, StatusBox, containerLinuxUpdateOperator } from '../utils';

const filters = {
  'name': (filter, obj) => fuzzy(filter, obj.metadata.name),

  // Filter role by role kind
  'role-kind': (filter, role) => filter.selected.has(roleType(role)),

  // Filter role bindings by role kind
  'role-binding-kind': (filter, binding) => filter.selected.has(bindingType(binding)),

  // Filter role bindings by text match
  'role-binding': (str, {metadata, roleRef, subject}) => {
    const isMatch = val => fuzzy(str.toLowerCase(), val.toLowerCase());
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
};

const getFilteredRows = (_filters, objects) => {
  if (_.isEmpty(_filters)) {
    return objects;
  }

  let chain = _.chain(objects);

  _.each(_filters, (value, name) => {
    chain = chain.filter(filters[name].bind({}, value));
  });

  return chain.value();
};

const filterPropType = (props, propName, componentName) => {
  if (!props) {
    return;
  }

  for (let key of _.keys(props[propName])) {
    if (key in filters) {
      continue;
    }
    return new Error(`Invalid prop '${propName}' in '${componentName}'. '${key}' is not a valid filter type!`);
  }
};

const sorts = {
  daemonsetNumScheduled: daemonset => _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: resource => _.size(_.get(resource, 'data')),
  etcdClusterPodSelector: cluster => `etcd_cluster=${cluster.metadata.name}`,
  ingressValidHosts,
  nodeReadiness: node => _.chain(node).get('status.conditions').find({type: 'Ready'}).get('status').value(),
  nodeUpdateStatus: node => _.get(containerLinuxUpdateOperator.getUpdateStatus(node), 'text'),
  numReplicas: resource => _.toInteger(_.get(resource, 'status.replicas')),
  podPhase,
  podReadiness,
  string: val => JSON.stringify(val),
};

export const ColHead = ({applySort, children, className, currentSortField, currentSortFunc, currentSortOrder, sortField, sortFunc}) => {
  if (!sortField && !sortFunc) {
    return <div className={className}>{children}</div>;
  }

  const isSorted = sortField === currentSortField && sortFunc === currentSortFunc;
  const newSortOrder = isSorted && currentSortOrder === 'asc' ? 'desc' : 'asc';
  const onClick = () => applySort(sortField, sortFunc, newSortOrder);
  return <div className={className}>
    <a className={isSorted ? undefined : 'co-m-table-grid__sort-link--unsorted'} onClick={onClick}>{children}</a>
    {isSorted && <i className={`co-m-table-grid__sort-arrow fa fa-long-arrow-${currentSortOrder === 'asc' ? 'up' : 'down'}`}></i>}
  </div>;
};

ColHead.propTypes = {
  applySort: React.PropTypes.func,
  children: React.PropTypes.node,
  className: React.PropTypes.string,
  currentSortField: React.PropTypes.string,
  currentSortFunc: React.PropTypes.string,
  currentSortOrder: React.PropTypes.string,
  sortField: React.PropTypes.string,
  sortFunc: React.PropTypes.string,
};

export const ListHeader = ({children}) => <div className="row co-m-table-grid__head">{children}</div>;

export const WorkloadListHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-5 col-xs-6" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs" sortFunc="numReplicas">Status</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm" sortField="spec.selector">Pod Selector</ColHead>
</ListHeader>;

const Rows = ({data, expand, Row}) => <div className="co-m-table-grid__body">
  {data.map(obj => <Row key={obj.rowKey || getQN(obj)} obj={obj} expand={expand} />)}
</div>;

Rows.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  expand: React.PropTypes.bool,
  Row: React.PropTypes.func.isRequired,
};

const stateToProps = ({UI}, {data, filters, reduxID, reduxIDs, rowSplitter, staticFilters}) => {
  if (rowSplitter) {
    data = _.flatMap(data, rowSplitter);
  }
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;
  const currentSortField = UI.getIn(['listSorts', listId, 'field'], 'metadata.name');
  const currentSortFunc = UI.getIn(['listSorts', listId, 'func']);
  const currentSortOrder = UI.getIn(['listSorts', listId, 'order'], 'asc');

  let sortBy = 'metadata.name';
  if (currentSortField) {
    // Sort resources by one of their fields as a string
    sortBy = resource => sorts.string(_.get(resource, currentSortField, ''));
  } else if (currentSortFunc && sorts[currentSortFunc]) {
    // Sort resources by a function in the 'sorts' object
    sortBy = sorts[currentSortFunc];
  }

  // Always set the secondary sort criteria to ascending by name
  const newData = _.orderBy(getFilteredRows(allFilters, data), [sortBy, 'metadata.name'], [currentSortOrder, 'asc']);

  return {currentSortField, currentSortFunc, currentSortOrder, data: newData, listId};
};

export const List = connect(stateToProps, {sortList: UIActions.sortList})(props => {
  const {currentSortField, currentSortFunc, currentSortOrder, expand, Header, listId, Row, sortList} = props;
  return <div className="co-m-table-grid co-m-table-grid--bordered">
    <StatusBox {...props}>
      <Header
        applySort={_.partial(sortList, listId)}
        currentSortField={currentSortField}
        currentSortFunc={currentSortFunc}
        currentSortOrder={currentSortOrder}
      />
      <Rows expand={expand} Row={Row} />
    </StatusBox>
  </div>;
});

List.propTypes = {
  data: React.PropTypes.array,
  EmptyMsg: React.PropTypes.func,
  expand: React.PropTypes.bool,
  fieldSelector: React.PropTypes.string,
  filters: filterPropType,
  Header: React.PropTypes.func.isRequired,
  loaded: React.PropTypes.bool,
  loadError: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]),
  namespace: React.PropTypes.string,
  reduxID: React.PropTypes.string,
  reduxIDs: React.PropTypes.array,
  Row: React.PropTypes.func.isRequired,
  rowSplitter: React.PropTypes.func,
  selector: React.PropTypes.object,
  staticFilters: React.PropTypes.array,
};

export const rowOfKind = (kind, actions) => {
  return class rowOfKindComponent extends React.Component {
    shouldComponentUpdate(nextProps) {
      return _.get(this.props.obj, 'metadata.resourceVersion') !== _.get(nextProps.obj, 'metadata.resourceVersion');
    }

    render() {
      const o = this.props.obj;

      return <div className="row co-resource-list__item">
        <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
          <ResourceCog actions={actions} kind={kind} resource={o} />
          <ResourceLink kind={kind} name={o.metadata.name} namespace={o.metadata.namespace} title={o.metadata.uid} />
        </div>
        <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
          <LabelList kind={kind} labels={o.metadata.labels} />
        </div>
        <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
          <Link to={`${resourcePath(kind, o.metadata.name, o.metadata.namespace)}/pods`} title="pods">
            {o.status.replicas || 0} of {o.spec.replicas} pods
          </Link>
        </div>
        <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
          <Selector selector={o.spec.selector} />
        </div>
      </div>;
    }
  };
};
