import React from 'react';

import {Firehose, VertNav, NavTitle} from '../utils';

export const DetailsPage = (props) => <Firehose {...props}>
  <NavTitle detail={true} title={props.name} menuActions={props.menuActions} />
  <VertNav pages={props.pages} className={`co-m-${props.kind}`} />
</Firehose>;
