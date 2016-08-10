import React from 'react';
import fuzzy from 'fuzzysearch';

import actions from '../module/k8s/k8s-actions';
import {angulars, withStoreAndHose, register} from './react-wrapper';
import {podPhase} from '../module/filter/pods';

const StatusBox = ({children}) => <div className="cos-status-box"> {children} </div>

const LoadError = ({labelPlural}) => <StatusBox>
  <div className="cos-tristate--error">
    <div className="cos-text-center cos-error-title">Error Loading {labelPlural}</div>
    <div className="cos-text-center">Please try again.</div>
  </div>
</StatusBox>

const Empty = ({labelPlural}) => <StatusBox>
  <div className="cos-tristate-empty">
    <div className="cos-text-center">No {labelPlural} Found</div>
  </div>
</StatusBox>

const Loading = () => <StatusBox>
  <div className="co-m-loader co-an-fade-in-out">
    <div className="co-m-loader-dot__one"></div>
    <div className="co-m-loader-dot__two"></div>
    <div className="co-m-loader-dot__three"></div>
  </div>
</StatusBox>

const filters = {
  name: (filter, obj) => fuzzy(filter, obj.metadata.name),
  podStatus: (phase, pod) => !phase ? true : (pod.status.phase === phase || podPhase(pod) === phase),
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

export default (name, type, Header, Row) => {
  class Inner extends React.Component {
    render () {
      const {loadError, labelPlural, loaded} = this.props;

      if (loadError) {
        return <LoadError labelPlural={labelPlural} loadError={loadError} />;
      }

      if (!loaded) {
        return <Loading />
      }

      let objects = this.props.objects || [];

      if (!objects.length) {
        return <Empty labelPlural={labelPlural} />;
      }

      const rows = filter(this.props.filters, objects).map(object => <Row key={object.metadata.name} {...object} />);
      return <div className="co-m-table-grid__body"> {rows} </div>;
    }
  };
  Inner.propTypes = {
    filters: filterPropType,
  };

  class ReactiveList extends React.Component {
    constructor (props) {
      super(props);
      const k8sResource = angulars.k8s[type];
      this.kind = k8sResource.kind;
      this.firehose = new angulars.Firehose(k8sResource, props.namespace, props.selector, props.fieldSelector);
      const id = this.firehose.id;
      this.InnerWithHose = withStoreAndHose(Inner, id);
    }

    applyFilter (name, value) {
      if (!this.firehose) {
        return;
      }
      angulars.store.dispatch(actions.filter(this.firehose.id, name, value));
    }

    render () {
      const klass = `co-m-${this.kind.id}-list co-m-table-grid co-m-table-grid--bordered`;
      return (
        <div className={klass}>
          <Header />
          <this.InnerWithHose labelPlural={this.kind.labelPlural} />
        </div>
      );
    };

    componentDidMount() {
      this.firehose.watchList();
    }

    componentWillUnmount() {
      this.firehose.unwatchList();
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
  };

  register(name, ReactiveList);
  return ReactiveList;
};
