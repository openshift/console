import React from 'react';
import fuzzy from 'fuzzysearch';
import {Provider} from 'react-redux';

import actions from '../../module/k8s/k8s-actions';
import {podPhase} from '../../module/filter/pods';
import {Firehose, StatusBox} from '../utils';
import {angulars, register} from '../react-wrapper';

const filters = {
  'name': (filter, obj) => fuzzy(filter, obj.metadata.name),
  'pod-status': (phases, pod) => {
    if (!phases || !phases.size) {
      return true;
    }
    return phases.has(pod.status.phase) || phases.has(podPhase(pod));
  },
}

const filter = (_filters, objects) => {
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
    return new Error(`Invalid prop ${propFullName}in ${componentName}.  (${key}) is not a valid filter type!`);
  }
};

class Rows extends React.Component {
  render () {
    const {filters, data, onClickRow, Row} = this.props;
    const selected = this.props.selected && this.props.selected.metadata.name;
    const rows = filter(filters, data).map(object =>
      <Row key={object.metadata.name} {...object} onClick={onClickRow} isActive={selected===object.metadata.name} />
    );
    return <div className="co-m-table-grid__body"> {rows} </div>;
  }
}

Rows.propTypes = {
  filters: filterPropType,
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  Row: React.PropTypes.func.isRequired,
};

export const makeList = (name, kindstring, Header, Row) => {
  class ReactiveList extends React.Component {
    applyFilter (name, value) {
      const id = this.refs.hose.id;
      if (!id) {
        return;
      }
      const {store} = angulars;
      store.dispatch(actions.filterList(id, name, value));
    }

    componentWillReceiveProps(nextProps) {
      this.setState({selected: nextProps.selected});
    }

    render () {
      const {kinds, k8s} = angulars;
      const kind = kinds[kindstring];
      const k8sResource = k8s[kind.plural];
      const klass = `co-m-${kind.id}-list co-m-table-grid co-m-table-grid--bordered`;
      const {filters, onClickRow} = this.props;

      return <Provider store={angulars.store}>
        <div className={klass}>
          <Header />
          <Firehose ref="hose" isList={true} k8sResource={k8sResource} {...this.props}>
            <StatusBox>
              <Rows Row={Row} filters={filters} onClickRow={onClickRow} selected={this.state && this.state.selected} />
            </StatusBox>
          </Firehose>
        </div>
      </Provider>
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
