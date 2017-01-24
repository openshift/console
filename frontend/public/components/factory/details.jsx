import React from 'react';
import {Provider} from 'react-redux';

import {Firehose, VertNav, NavTitle} from '../utils';
import {angulars} from '../react-wrapper';


export const ReactiveDetails = (props) => <Provider store={props.store}>
  <Firehose {...props}>
    {props.children}
  </Firehose>
</Provider>;

export const DetailsPage = (props) => <ReactiveDetails {...props} store={angulars.store}>
  <NavTitle detail={true} title={props.name} menuActions={props.menuActions} />
  <VertNav pages={props.pages} className={`co-m-${props.kind}`} />
</ReactiveDetails>;
