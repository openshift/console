import React from 'react';
import {Provider} from 'react-redux';

import {Firehose, VertNav, NavTitle} from '../utils';
import {angulars, register} from '../react-wrapper';


export const ReactiveDetails = (props) => <Provider store={props.store}>
  <Firehose {...props}>
    {props.children}
  </Firehose>
</Provider>;

export const makeDetailsPage = (name, type, pages) => {
  class ReactiveDetailsPage extends React.Component {
    render () {
      const {kinds, k8s, store} = angulars;
      const kind = kinds[type];
      const k8sResource = k8s[kind.plural];

      return <ReactiveDetails store={store} k8sResource={k8sResource} {...this.props}>
        <NavTitle detail={true} title={this.props.name} />
        <VertNav pages={pages} className={`co-m-${kind.id}`} />
      </ReactiveDetails>;
    }
  }

  register(name, ReactiveDetailsPage);
  return ReactiveDetailsPage;
};
