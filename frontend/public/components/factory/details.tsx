/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { match } from 'react-router-dom';

import { Firehose, VertNav, NavTitle } from '../utils';

export const DetailsPage: React.StatelessComponent<DetailsPageProps> = (props) => <Firehose resources={[{
  kind: props.kind,
  name: props.name,
  namespace: props.namespace,
  isList: false,
  prop: 'obj',
}]}>
  <NavTitle detail={true} title={props.name} menuActions={props.menuActions} kind={props.kind} breadcrumbs={props.breadcrumbs} />
  <VertNav pages={props.pages} className={`co-m-${props.kind}`} match={props.match} label={props.label || props.kind.label}/>
</Firehose>;

export type DetailsPageProps = {
  match: match<any>;
  title?: string | JSX.Element;
  menuActions?: any[];
  pages: any[];
  kind: string | any;
  label?: string;
  name?: string;
  namespace?: string;
  isList: boolean;
  breadcrumbs?: {name: string, path: string}[];
};

DetailsPage.displayName = 'DetailsPage';
