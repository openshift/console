import React from 'react';
import fuzzy from 'fuzzysearch';

import actions from '../module/k8s/k8s-actions';
import {podPhase} from '../module/filter/pods';
import {withStatusBox} from './utils';

import {angulars, connectComponentToListID, register} from './react-wrapper';


const filters = {
  'name': (filter, obj) => fuzzy(filter, obj.metadata.name),
  'pod-status': (phase, pod) => !phase ? true : (pod.status.phase === phase || podPhase(pod) === phase),
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

export default (name, kindstring, Header, Row) => {
  class Inner extends React.Component {
    render () {
      const {filters, data} = this.props;
      const rows = filter(filters, data).map(object => <Row key={object.metadata.name} {...object} />);
      return <div className="co-m-table-grid__body"> {rows} </div>;
    }
  };

  Inner.propTypes = {
    filters: filterPropType,
  };

  class ReactiveList extends React.Component {
    constructor (props) {
      super(props);
      const {kinds, k8s, Firehose} = angulars;
      const kind = kinds[kindstring];
      const k8sResource = k8s[kind.plural];
      this.kind = k8sResource.kind;
      const {selectorRequired, selector, namespace, fieldSelector} = props;
      if (selectorRequired && !props.selector) {
        this.Component = () => <withStatusBox.Empty label={this.kind.labelPlural} />;
        return;
      }
      this.firehose = new Firehose(k8sResource, namespace, selector, fieldSelector);
      this.Component = connectComponentToListID(withStatusBox(Inner), this.firehose.id);
    }

    applyFilter (name, value) {
      if (!this.firehose) {
        return;
      }
      const {store} = angulars;
      store.dispatch(actions.filterList(this.firehose.id, name, value));
    }

    render () {
      const klass = `co-m-${this.kind.id}-list co-m-table-grid co-m-table-grid--bordered`;
      return (
        <div className={klass}>
          <Header />
          <this.Component label={this.kind.labelPlural} />
        </div>
      );
    };

    componentDidMount() {
      this.firehose && this.firehose.watchList();
    }

    componentWillUnmount() {
      this.firehose && this.firehose.unwatchList();
      this.firehose = null;
    }
  }
  ReactiveList.propTypes = {
    'namespace': React.PropTypes.string,
    'selector': React.PropTypes.object,
    'search': React.PropTypes.string,
    'filter': React.PropTypes.string,
    'error': React.PropTypes.bool,
    'fieldSelector': React.PropTypes.string,
    'selectorRequired': React.PropTypes.bool,
  };

  register(name, ReactiveList);
  return ReactiveList;
};
