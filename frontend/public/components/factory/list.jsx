import React from 'react';
import fuzzy from 'fuzzysearch';
import {Provider} from 'react-redux';

import actions from '../../module/k8s/k8s-actions';
import {Firehose, podPhase, StatusBox} from '../utils';
import {angulars, register} from '../react-wrapper';

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
    const isReady = angulars.k8sNodes.isReady(node);
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
  const {k8s: {getQN}} = angulars;
  const {expand, filters, data, selected, selectRow, Row} = props;
  const rows = getFilteredRows(filters, data).map(object => {
    return <Row key={getQN(object)} obj={object} expand={expand} onClick={selectRow} isActive={selected === getQN(object)} />;
  });
  return <div className="co-m-table-grid__body"> {rows} </div>;
};

Rows.propTypes = {
  filters: filterPropType,
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  expand: React.PropTypes.bool,
  Row: React.PropTypes.func.isRequired,
  selected: React.PropTypes.string,
  selectRow: React.PropTypes.func.isRequired,
};

export const makeList = (name, kindstring, Header, Row) => {

  class ReactiveList extends React.Component {
    static get k8sResource () {
      const {kinds, k8s} = angulars;
      const kind = kinds[kindstring];
      return k8s[kind.plural];
    }

    get id () {
      return this.refs.hose.id;
    }

    applyFilter (filterName, value) {
      if (!this.id) {
        return;
      }
      const {store} = angulars;
      store.dispatch(actions.filterList(this.id, filterName, value));
    }

    selectRow (qualifiedName) {
      if (!this.id) {
        return;
      }
      const {store} = angulars;
      store.dispatch(actions.selectInList(this.id, qualifiedName));
    }

    render () {
      const k8sResource = ReactiveList.k8sResource;
      const kindID = k8sResource.kind.id;
      const klass = `co-m-${kindID}-list co-m-table-grid co-m-table-grid--bordered`;

      return <Provider store={angulars.store}>
        <div className={klass}>
          <Header />
          <Firehose ref="hose" isList={true} k8sResource={k8sResource} {...this.props}>
            <StatusBox>
              <Rows Row={Row} selectRow={qualifiedName => this.selectRow(qualifiedName)} expand={this.props.expand} />
            </StatusBox>
          </Firehose>
        </div>
      </Provider>;
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
    'selectorRequired': React.PropTypes.bool,
    'onClickRow': React.PropTypes.func
  };

  register(name, ReactiveList);
  return ReactiveList;
};
