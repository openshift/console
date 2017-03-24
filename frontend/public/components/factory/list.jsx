import React from 'react';
import fuzzy from 'fuzzysearch';

import store from '../../redux';
import {getQN, isNodeReady} from '../../module/k8s';
import actions from '../../module/k8s/k8s-actions';
import {Firehose, podPhase, StatusBox} from '../utils';

const filters = {
  'name': (filter, obj) => fuzzy(filter, obj.metadata.name),

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
  const {expand, filters, data, selected, selectRow, sortBy, Row} = props;
  const rows = _.sortBy(getFilteredRows(filters, data), sortBy).map(object => {
    return <Row key={getQN(object)} obj={object} expand={expand} onClick={selectRow} isActive={selected === getQN(object)} />;
  });
  return <div className="co-m-table-grid__body"> {rows} </div>;
};

Rows.propTypes = {
  filters: filterPropType,
  sortBy: React.PropTypes.func,
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  expand: React.PropTypes.bool,
  Row: React.PropTypes.func.isRequired,
  selected: React.PropTypes.string,
  selectRow: React.PropTypes.func.isRequired,
};

export const makeList = (name, kind, Header, Row, sortBy = undefined) => {
  class ReactiveList extends React.Component {
    static get kind () {
      return kind;
    }

    get id () {
      return this.refs.hose.id;
    }

    applyFilter (filterName, value) {
      if (!this.id) {
        return;
      }
      store.dispatch(actions.filterList(this.id, filterName, value));
    }

    selectRow (qualifiedName) {
      if (!this.id) {
        return;
      }
      store.dispatch(actions.selectInList(this.id, qualifiedName));
    }

    render () {
      const klass = `co-m-${kind}-list co-m-table-grid co-m-table-grid--bordered`;
      const sort = sortBy || (item => item.metadata ? item.metadata.name: null);

      return <div className={klass}>
        <Firehose ref="hose" isList={true} {...this.props} kind={kind}>
          <StatusBox>
            <Header data={this.props.data} />
            <Rows Row={Row} sortBy={sort} selectRow={qualifiedName => this.selectRow(qualifiedName)} expand={this.props.expand} />
          </StatusBox>
        </Firehose>
      </div>;
    }
  }

  ReactiveList.propTypes = {
    'namespace': React.PropTypes.string,
    'selector': React.PropTypes.object,
    'selected': React.PropTypes.object,
    'search': React.PropTypes.string,
    'filter': React.PropTypes.string,
    'error': React.PropTypes.bool,
    'fieldSelector': React.PropTypes.string,
    'onClickRow': React.PropTypes.func
  };

  return ReactiveList;
};
