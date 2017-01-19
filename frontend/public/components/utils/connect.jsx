import React from 'react';
import {connect as reactReduxConnect, Provider} from 'react-redux';

import {k8sKinds} from '../../module/k8s';
import {angulars} from '../react-wrapper';
import {inject} from './index';

export const kindObj = kind => _.isString(kind) && k8sKinds[kind.toUpperCase()] || {};

export const k8sResource = kind => {
  const {plural} = kindObj(kind);
  return plural && angulars.k8s[plural];
};

// Pulls data out of redux given an object and selectors
export class WithQuery extends React.Component {
  constructor (props) {
    super(props);
    const {Firehose} = angulars;
    const {kind, namespace, selector, fieldSelector, name} = this.props;
    // Just created to get the ID :-/
    const firehose = new Firehose(k8sResource(kind), namespace, selector, fieldSelector, name);
    this.firehoseId = firehose.id;
  }

  getFirehoseId () {
    return this.firehoseId;
  }

  render () {
    return <ConnectToState store={angulars.store} reduxID={this.firehoseId} {...this.props}>
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
    loadError: k8s.getIn([reduxID, 'loadError']),
    loaded: k8s.getIn([reduxID, 'loaded']),
    selected,
  };
};

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
export const ConnectToState = reactReduxConnect(processReduxId)(props => {
  const {children, className} = props;
  const newChildren = inject(children, _.omit(props, ['className', 'children', 'reduxID', 'isList']));
  return <div className={className}>{newChildren}</div>;
});

// Same as ConnectToState, but takes in multiple reduxIDs,
// and maps their data to a specified prop instead.
export const MultiConnectToState = reactReduxConnect(({k8s}, props) => {
  const {reduxes} = props;

  const propsToInject = {};
  reduxes.forEach((redux) => {
    propsToInject[redux.prop] = processReduxId({ k8s: k8s}, redux);
  });

  return propsToInject;
})(props => {
  const {children, className} = props;
  const newChildren = inject(children, _.omit(props, ['className', 'children', 'reduxes', 'idToPropMapping']));
  return <div className={className}>{newChildren}</div>;
});
MultiConnectToState.propTypes = {
  reduxes: React.PropTypes.array
};

export const connect = (...args) => Component => {
  const Wrapped = reactReduxConnect(...args)(Component);

  return props => <Provider store={angulars.store}>
    <Wrapped {...props} />
  </Provider>;
};
