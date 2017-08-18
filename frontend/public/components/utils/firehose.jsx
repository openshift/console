import * as React from 'react';
import * as PropTypes from 'prop-types';

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
  kind: PropTypes.string,
  name: PropTypes.string,
  namespace: PropTypes.string,
  selector: PropTypes.object,
  fieldSelector: PropTypes.string,
  className: PropTypes.string,
  isList: PropTypes.bool,
};

export class MultiFirehose extends FirehoseBase {
  constructor(props) {
    super(props);
    this.resources = props.resources.map(r => Object.assign({}, r, {firehose: this._initFirehose(r)}));
  }

  componentDidMount() {
    this.resources.forEach((resource) => {
      this._mountFirehose(resource.firehose, resource);
    });
  }

  componentWillUnmount() {
    this.resources.forEach((resource, i) => {
      this._unmountFirehose(resource.firehose);
      this.resources[i].firehose = null;
    });
  }

  render() {
    const reduxes = this.resources.map((resource) => {
      return _.defaults({}, { reduxID: resource.firehose.id }, resource);
    });

    return <MultiConnectToState reduxes={reduxes}>
      {this.props.children}
    </MultiConnectToState>;
  }
}
MultiFirehose.propTypes = {
  children: PropTypes.node,
  resources: PropTypes.array
};
