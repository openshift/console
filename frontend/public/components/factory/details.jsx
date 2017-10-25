import * as React from 'react';

import { Firehose, VertNav, NavTitle } from '../utils';

/** @type {React.StatelessComponent<{name: string, menuActions?: any[], pages: any[], kind: string}>} */
export const DetailsPage = (props) => <Firehose resources={[{
  kind: props.kind,
  name: props.name,
  namespace: props.namespace,
  isList: false,
  prop: 'obj',
}]}>
  <NavTitle detail={true} title={props.name} menuActions={props.menuActions} kind={props.kind} />
  <VertNav pages={props.pages} className={`co-m-${props.kind}`} match={props.match} label={props.label || props.kind.label}/>
</Firehose>;

// DetailsPage.
