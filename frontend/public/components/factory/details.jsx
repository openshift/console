import React from 'react';
import {Provider} from 'react-redux';

import {Firehose, VertNav, NavTitle} from '../utils';
import {angulars, register} from '../react-wrapper';


export const ReactiveDetails = (props) => <Provider store={props.store}>
  <Firehose {...props}>
    {props.children}
  </Firehose>
</Provider>;

export const makeDetailsPage = (name, kind, pages) => {
  class ReactiveDetailsPage extends React.Component {
    render () {
      return <ReactiveDetails {...this.props} store={angulars.store} kind={kind}>
        <NavTitle detail={true} title={this.props.name} />
        <VertNav pages={pages} className={`co-m-${kind}`} />
      </ReactiveDetails>;
    }
  }

  register(name, ReactiveDetailsPage);
  return ReactiveDetailsPage;
};
