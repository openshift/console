import * as React from 'react';
import { match } from 'react-router-dom';
import * as _ from 'lodash-es';

import { Firehose, VertNav, NavTitle } from '../utils';
import { K8sResourceKindReference } from '../../module/k8s';

export const DetailsPage: React.SFC<DetailsPageProps> = (props) => <Firehose resources={[{
  kind: props.kind,
  name: props.name,
  namespace: props.namespace,
  isList: false,
  prop: 'obj',
}]}>
  <NavTitle detail={true} title={props.name} menuActions={props.menuActions} kind={props.kind} breadcrumbs={props.breadcrumbs} />
  <VertNav pages={props.pages} className={`co-m-${_.get(props.kind, 'kind', props.kind)}`} match={props.match} label={props.label || (props.kind as any).label} />
</Firehose>;

/* eslint-disable no-undef */
export type DetailsPageProps = {
  match: match<any>;
  title?: string | JSX.Element;
  menuActions?: any[];
  pages: any[];
  kind: K8sResourceKindReference;
  label?: string;
  name?: string;
  namespace?: string;
  breadcrumbs?: {name: string, path: string}[];
};
/* eslint-enable no-undef */

DetailsPage.displayName = 'DetailsPage';
