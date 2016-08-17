import React from 'react';

import {withStatusBox} from './utils';
import {angulars, connectComponentToObjectID, register} from './react-wrapper';

export default (name, kindstring, Component) => {
  class ReactiveDetails extends React.Component {
    constructor (props) {
      super(props);
      const {kinds, k8s, Firehose} = angulars;
      const kind = kinds[kindstring];
      const k8sResource = k8s[kind.plural];

      this.kind = k8sResource.kind;
      // statusbox and splats data we care about so we don't have to worry about tracking prop names...
      const inner = withStatusBox(({data}) => <Component {...data} />);

      this.firehose = new Firehose(k8sResource, props.namespace, props.selector, props.fieldSelector, props.name);
      this.Component = connectComponentToObjectID(inner, this.firehose.id);
    }

    render () {
      const {id, label} = this.kind;
      return (
        <div className={`co-m-${id}`}>
          <this.Component label={label} />
        </div>
      );
    };

    componentDidMount() {
      this.firehose.watchObject();
    }

    componentWillUnmount() {
      this.firehose.unwatchList();
      this.firehose = null;
    }
  }
  ReactiveDetails.propTypes = {
    'namespace': React.PropTypes.string,
    'name': React.PropTypes.string,
    'error': React.PropTypes.bool,
  };

  register(name, ReactiveDetails);
  return ReactiveDetails;
};
