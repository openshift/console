/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { match } from 'react-router-dom';
import * as _ from 'lodash-es';

import { Firehose, VertNav, NavTitle } from '../utils';
import { K8sResourceKindReference, K8sResourceKind } from '../../module/k8s';

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace: string;
  isList?: boolean;
  prop: string;
};

export const DetailsPage: React.SFC<DetailsPageProps> = (props) => <Firehose resources={[{
  kind: props.kind,
  name: props.name,
  namespace: props.namespace,
  isList: false,
  prop: 'obj',
} as FirehoseResource].concat(props.resources || [])}>
  <NavTitle
    detail={true}
    title={props.name}
    titleFunc={props.titleFunc}
    menuActions={props.menuActions}
    buttonActions={props.buttonActions}
    kind={props.kind}
    breadcrumbsFor={props.breadcrumbsFor} />
  <VertNav
    pages={props.pages}
    className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
    match={props.match}
    label={props.label || (props.kind as any).label}
    resourceKeys={_.map(props.resources, 'prop')} />
</Firehose>;

export type DetailsPageProps = {
  match: match<any>;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  menuActions?: any[];
  buttonActions?: any[];
  pages: any[];
  kind: K8sResourceKindReference;
  label?: string;
  name?: string;
  namespace?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (obj: K8sResourceKind) => {name: string, path: string}[];
};

DetailsPage.displayName = 'DetailsPage';
