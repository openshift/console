import React from 'react';
import {connect} from 'react-redux';

import {angulars} from '../react-wrapper';
import {inject} from './index';

// Pulls data out of redux given an object and selectors
export const WithQuery = (props) => {
  const {Firehose} = angulars;
  const {k8sResource, namespace, selector, fieldSelector, name} = props;
  // Just created to get the ID :-/
  const firehose = new Firehose(k8sResource, namespace, selector, fieldSelector, name);
  return <ConnectToState store={angulars.store} reduxID={firehose.id} {...props}>
    {props.children}
  </ConnectToState>
}

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
export const ConnectToState = connect(({k8s}, props) => {
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
})(props => {
  const {children, className} = props;
  const newChildren = inject(children, _.omit(props, ['className', 'children', 'reduxID', 'isList']));
  return <div className={className}>{newChildren}</div>;
});
