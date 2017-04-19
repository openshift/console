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
  'role-binding': (str, {roleRef, subjects}) => {
    const isMatch = val => fuzzy(str.toLowerCase(), val.toLowerCase());
    return [roleRef.name, ..._.map(subjects, 'kind'), ..._.map(subjects, 'name')].some(isMatch);
  },

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

    const allFilters = _.values(_.fromPairs(phases.all || []));
    const phase = podPhase(pod);

    return phases.selected.has(phase) || !_.includes(allFilters, phase);
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

const Rows = (props) => {
  const {expand, filters, data, sortBy, Row} = props;
  const rows = _.sortBy(getFilteredRows(filters, data), sortBy).map(object => {
    return <Row key={getQN(object)} obj={object} expand={expand} />;
  });
  return <div className="co-m-table-grid__body"> {rows} </div>;
};

Rows.propTypes = {
  filters: filterPropType,
  sortBy: React.PropTypes.func,
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  expand: React.PropTypes.bool,
  Row: React.PropTypes.func.isRequired,
};

export const List = props => {
  const {expand, Header, Row, sortBy} = props;
  return <div className="co-m-table-grid co-m-table-grid--bordered">
    <StatusBox {...props}>
      <Header />
      <Rows Row={Row} expand={expand} sortBy={sortBy || (item => _.get(item, 'metadata.name'))} />
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
};

export const MultiList = props => {
  const resources = _.pick(props, props.kinds);

  // If any resources loaded, display them and ignore errors for resources that didn't load
  const loaded = _.some(resources, r => r.loaded);
  const resourceProps = {
    data: _.flatMap(resources, 'data').filter(d => d !== undefined),
    filters: Object.assign({}, ..._.map(resources, 'filters')),
    loadError: loaded ? '' : _.map(resources, 'loadError').filter(Boolean).join(', '),
    loaded,
  };
  return <List {...props} {...resourceProps} />;
};
