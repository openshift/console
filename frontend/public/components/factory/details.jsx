import React from 'react';

import {Firehose, VertNav, NavTitle} from '../utils';

export const ReactiveDetails = (props) => <Firehose {...props}>
  {props.children}
</Firehose>;

export const DetailsPage = (props) => <ReactiveDetails {...props}>
  <NavTitle detail={true} title={props.name} menuActions={props.menuActions} />
  <VertNav pages={props.pages} className={`co-m-${props.kind}`} />
</ReactiveDetails>;
