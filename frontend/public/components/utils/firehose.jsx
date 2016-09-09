import React from 'react';
import {connect} from 'react-redux';

import {angulars} from '../react-wrapper';
import {EmptyBox, inject} from './index';

const InjectProps = connect((state, props) => props.stateToProps)(props => {
  const {children, className} = props;
  const newChildren = inject(children, _.omit(props, ['className', 'children']));

  return <div className={className}>{newChildren}</div>;
});

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
    this.stateToProps_ = this.stateToProps.bind(this);
  }

  get id () {
    return this.firehose && this.firehose.id;
  }

  stateToProps ({k8s}, {filters}) {
    const reduxID = this.id;

    // are we watching a single object?
    if (!this.props.isList) {
      const stuff = k8s.get(reduxID);
      return stuff ? stuff.toJS() : {};
    }

    // We are watching a list of objects.
    const data = k8s.getIn([reduxID, 'data']);
    const _filters = k8s.getIn([reduxID, 'filters']);

    return {
      data: data && data.toArray().map(p => p.toJSON()),
      // This is a hack to allow filters passed down from props to make it to
      // the injected component. Ideally filters should all come from redux.
      filters: _.extend({}, _filters && _filters.toJS(), filters),
      loadError: k8s.getIn([reduxID, 'loadError']),
      loaded: k8s.getIn([reduxID, 'loaded']),
    };
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
      'isList',
    ]);

    newProps.label = label;

    return <InjectProps className={this.props.className} stateToProps={this.stateToProps_} {...newProps}>
      {children}
    </InjectProps>
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
