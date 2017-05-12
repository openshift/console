import React from 'react';
import fuzzy from 'fuzzysearch';

import { getQN, isNodeReady } from '../../module/k8s';
import { bindingType, roleType } from '../RBAC';
import { podPhase, StatusBox } from '../utils';

const filters = {
  'name': (filter, obj) => fuzzy(filter, obj.metadata.name),

  // Filter role by role kind
  'role-kind': (filter, role) => filter.selected.has(roleType(role)),

  // Filter role bindings by role kind
  'role-binding-kind': (filter, binding) => filter.selected.has(bindingType(binding)),

  // Filter role bindings by text match
  'role-binding': (str, {metadata, roleRef, subjects}) => {
    const isMatch = val => fuzzy(str.toLowerCase(), val.toLowerCase());
    return [metadata.name, roleRef.name, ..._.map(subjects, 'kind'), ..._.map(subjects, 'name')].some(isMatch);
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

const Rows = ({EmptyMsg, expand, filters, data, Row, sortBy, staticFilters}) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  const rows = _.sortBy(getFilteredRows(allFilters, data), sortBy).map(object => {
    return <Row key={getQN(object)} obj={object} expand={expand} />;
  });
  return (_.isEmpty(rows) && EmptyMsg) ? EmptyMsg : <div className="co-m-table-grid__body">{rows}</div>;
};

Rows.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  EmptyMsg: React.PropTypes.object,
  expand: React.PropTypes.bool,
  filters: filterPropType,
  Row: React.PropTypes.func.isRequired,
  sortBy: React.PropTypes.func,
  staticFilters: React.PropTypes.array,
};

export const List = props => {
  const {EmptyMsg, expand, Header, Row, sortBy, staticFilters} = props;
  return <div className="co-m-table-grid co-m-table-grid--bordered">
    <StatusBox {...props}>
      <Header />
      <Rows EmptyMsg={EmptyMsg} Row={Row} expand={expand} sortBy={sortBy || (item => _.get(item, 'metadata.name'))} staticFilters={staticFilters} />
    </StatusBox>
  </div>;
};

List.propTypes = {
  data: React.PropTypes.array,
  EmptyMsg: React.PropTypes.object,
  fieldSelector: React.PropTypes.string,
  filters: React.PropTypes.object,
  loaded: React.PropTypes.bool,
  loadError: React.PropTypes.string,
  namespace: React.PropTypes.string,
  reduxID: React.PropTypes.string,
  selector: React.PropTypes.object,
  staticFilters: React.PropTypes.array,
};
