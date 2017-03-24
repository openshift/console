import React from 'react';

import store from '../../redux';
import {K8sWatcher} from './k8s-watcher';
import {EmptyBox, ConnectToState, k8sResource, kindObj, MultiConnectToState} from './index';

class FirehoseBase extends React.Component {
  _initFirehose(props) {
    const {kind, namespace, name, fieldSelector, selector} = props;
    return new K8sWatcher(k8sResource(kind), namespace, selector, fieldSelector, name, store);
  }

  _mountFirehose(firehose, props) {
    if (!firehose) {
      return;
    }
    if (props.isList) {
      firehose.watchList();
      return;
    }
    firehose.watchObject();
  }

  _unmountFirehose(firehose) {
    if (!firehose) {
      return;
    }
    firehose.unwatchList();
  }
}

export class Firehose extends FirehoseBase {
  constructor (props) {
    super(props);
    this.firehose = this._initFirehose(props);
  }

  get id () {
    return this.firehose && this.firehose.id;
  }

  render () {
    const {props, props: {children, isList, kind}} = this;

    const {label, labelPlural} = kindObj(kind);
    const newLabel = isList ? labelPlural : label;

    if (!this.firehose) {
      return <EmptyBox label={newLabel} />;
    }

    const newProps = _.omit(props, [
      'children',
      'namespace',
      'selector',
      'fieldSelector',
      'name',
      'className',
    ]);

    newProps.label = newLabel;

    return <ConnectToState className={this.props.className} reduxID={this.id} {...newProps}>
      {children}
    </ConnectToState>;
  }

  componentDidMount() {
    this._mountFirehose(this.firehose, this.props);
  }

  componentWillUnmount() {
    this._unmountFirehose(this.firehose);
    this.firehose = null;
  }
}
Firehose.propTypes = {
  kind: React.PropTypes.string,
  name: React.PropTypes.string,
  namespace: React.PropTypes.string,
  selector: React.PropTypes.object,
  fieldSelector: React.PropTypes.string,
  className: React.PropTypes.string,
  isList: React.PropTypes.bool,
};

export class MultiFirehose extends FirehoseBase {
  constructor(props) {
    super(props);
    this.props.resources.forEach((resource) => {
      resource.firehose = this._initFirehose(resource);
    });
  }

  componentDidMount() {
    this.props.resources.forEach((resource) => {
      this._mountFirehose(resource.firehose, resource);
    });
  }

  componentWillUnmount() {
    this.props.resources.forEach((resource, index) => {
      this._unmountFirehose(resource.firehose);
      resource.firehose[index] = null;
    });
  }

  render() {
    const reduxes = this.props.resources.map((resource) => {
      return _.defaults({}, { reduxID: resource.firehose.id }, resource);
    });

    return <MultiConnectToState reduxes={reduxes}>
      {this.props.children}
    </MultiConnectToState>;
  }
}
MultiFirehose.propTypes = {
  children: React.PropTypes.node,
  resources: React.PropTypes.array
};
