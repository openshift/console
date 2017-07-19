import React from 'react';
import {connect} from 'react-redux';

import store from '../../redux';
import {K8sWatcher} from './k8s-watcher';
import {k8s as k8sModule, k8sKinds} from '../../module/k8s';
import {inject} from './index';

export const kindObj = kind => _.isString(kind) && k8sKinds[kind] || {};

export const k8sResource = kind => {
  const {plural} = kindObj(kind);
  return plural && k8sModule[plural];
};

// Pulls data out of redux given an object and selectors
export class WithQuery extends React.Component {
  constructor (props) {
    super(props);
    const {kind, namespace, selector, fieldSelector, name} = this.props;
    // Just created to get the ID :-/
    const firehose = new K8sWatcher(k8sResource(kind), namespace, selector, fieldSelector, name, store);
    this.firehoseId = firehose.id;
  }

  getFirehoseId () {
    return this.firehoseId;
  }

  render () {
    return <ConnectToState store={store} reduxID={this.firehoseId} {...this.props}>
      {this.props.children}
    </ConnectToState>;
  }
}

const processReduxId = ({k8s}, props) => {
  const {reduxID, isList, filters} = props;

  if (!reduxID) {
    return {};
  }

  if (!isList) {
    const stuff = k8s.get(reduxID);
    return stuff ? stuff.toJS() : {};
  }

  const data = k8s.getIn([reduxID, 'data']);
  const _filters = k8s.getIn([reduxID, 'filters']);
  const selected = k8s.getIn([reduxID, 'selected']);

  return {
    data: data && data.toArray().map(p => p.toJSON()),
    // This is a hack to allow filters passed down from props to make it to
    // the injected component. Ideally filters should all come from redux.
    filters: _.extend({}, _filters && _filters.toJS(), filters),
    kind: props.kind,
    loadError: k8s.getIn([reduxID, 'loadError']),
    loaded: k8s.getIn([reduxID, 'loaded']),
    selected,
  };
};

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
export const ConnectToState = connect(processReduxId)(function GenericConnectToState (props) {
  const {children, className} = props;
  const newChildren = inject(children, _.omit(props, ['className', 'children', 'isList']));
  return <div className={className}>{newChildren}</div>;
});

// Same as ConnectToState, but takes in multiple reduxIDs,
// and maps their data to a specified prop instead.
export const MultiConnectToState = connect(({k8s}, {reduxes}) => {
  const resources = {};

  reduxes.forEach(redux => {
    resources[redux.prop] = processReduxId({k8s}, redux);
  });

  // If any resources loaded, display them and ignore errors for resources that didn't load
  const loaded = _.some(resources, 'loaded');
  const loadError = loaded ? '' : _.map(resources, 'loadError').filter(Boolean).join(', ');

  return Object.assign({}, resources, {
    data: _.flatMap(resources, 'data').filter(d => d !== undefined),
    filters: Object.assign({}, ..._.map(resources, 'filters')),
    loaded,
    loadError,
    reduxIDs: _.map(reduxes, 'reduxID'),
    resources,
  });
})(props => <div className={props.className}>
  {inject(props.children, _.omit(props, ['children', 'className', 'reduxes']))}
</div>);

MultiConnectToState.propTypes = {
  reduxes: React.PropTypes.array
};
