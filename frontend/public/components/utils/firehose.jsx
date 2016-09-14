import React from 'react';

import {angulars} from '../react-wrapper';
import {EmptyBox, ConnectToState} from './index';


export class Firehose extends React.Component {
  constructor (props) {
    super(props);
    const {selectorRequired, selector} = props;
    if (selectorRequired && !props.selector) {
      return;
    }
    const {k8sResource, namespace, name, fieldSelector} = props;
    const {Firehose} = angulars;
    this.firehose = new Firehose(k8sResource, namespace, selector, fieldSelector, name);
  }

  get id () {
    return this.firehose && this.firehose.id;
  }

  render () {
    const {props, props: {children, isList, k8sResource: {kind}}} = this;

    let label;
    if (isList) {
      label = kind.labelPlural;
    } else {
      label = kind.label;
    }

    if (!this.firehose) {
      return <EmptyBox label={label} />;
    }

    const newProps = _.omit(props, [
      'children',
      'namespace',
      'selectorRequired',
      'selector',
      'fieldSelector',
      'name',
      'className',
    ]);

    newProps.label = label;

    return <ConnectToState className={this.props.className} reduxID={this.id} {...newProps}>
      {children}
    </ConnectToState>
  };

  componentDidMount() {
    const {firehose} = this;
    if (!firehose) {
      return;
    }
    if (this.props.isList) {
      firehose.watchList();
      return;
    }
    firehose.watchObject();
  }

  componentWillUnmount() {
    const {firehose} = this;
    if (!firehose) {
      return;
    }
    firehose.unwatchList();
    this.firehose = null;
  }
};

Firehose.propTypes = {
  k8sResource: React.PropTypes.object,
  name: React.PropTypes.string,
  namespace: React.PropTypes.string,
  selectorRequired: React.PropTypes.bool,
  selector: React.PropTypes.object,
  fieldSelector: React.PropTypes.string,
  name: React.PropTypes.string,
  className: React.PropTypes.string,
  isList: React.PropTypes.bool,
};
