import * as React from 'react';
import * as PropTypes from 'prop-types';

import store from '../../redux';
import {K8sWatcher} from './k8s-watcher';
import {EmptyBox, ConnectToState, kindObj, MultiConnectToState} from './index';

/** @augments {React.Component<{kind?: string, isList: boolean, selector?: any, fieldSelector?: any, name?: string, namespace?: string}>} */
class FirehoseBase extends React.Component {
  _initFirehose(props) {
    const {kind, namespace, name, fieldSelector, selector} = props;
    const k8sKind = kindObj(kind);
    return new K8sWatcher(k8sKind, namespace, selector, fieldSelector, name, store);
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

/** @type {React.StatelessComponent<{Component: React.ComponentType<any>, kind: string, isList: boolean, selector?: any}>} */
export const FirehoseHoC = (props) => <Firehose {...props}>
  <props.Component />
</Firehose>;

export class MultiFirehose extends FirehoseBase {
  constructor(props) {
    super(props);
    this.firehoses = props.resources.map(r => this._initFirehose(r));
  }

  componentDidUpdate({resources}) {
    const currentResources = this.props.resources;
    if (_.intersectionWith(resources, currentResources, _.isEqual).length === resources.length) {
      return;
    }
    this.componentWillUnmount();
    this.firehoses = this.props.resources.map(r => this._initFirehose(r));
    this.componentDidMount();
  }

  componentDidMount() {
    this.props.resources.forEach((resource, i) => {
      this._mountFirehose(this.firehoses[i], resource);
    });
  }

  componentWillUnmount() {
    this.props.resources.forEach((resource, i) => {
      this._unmountFirehose(this.firehoses[i]);
    });
    this.firehoses = [];
  }

  render() {
    const reduxes = this.props.resources.map((resource, i) => {
      return _.defaults({}, { reduxID: this.firehoses[i].id }, resource);
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
