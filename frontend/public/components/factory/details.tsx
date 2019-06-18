import * as React from 'react';
import { match } from 'react-router-dom';
import * as _ from 'lodash';

import { Firehose, HorizontalNav, PageHeading } from '../utils';
import { K8sResourceKindReference, K8sResourceKind, Selector } from '../../module/k8s';
import { withFallback } from '../utils/error-boundary';
import { ErrorBoundaryFallback } from '../error';

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace: string;
  isList?: boolean;
  selector?: Selector;
  prop: string;
};

export const DetailsPage = withFallback<DetailsPageProps>((props) => <Firehose resources={[{
  kind: props.kind,
  name: props.name,
  namespace: props.namespace,
  isList: false,
  prop: 'obj',
} as FirehoseResource].concat(props.resources || [])}>
  <PageHeading
    detail={true}
    title={props.name}
    titleFunc={props.titleFunc}
    menuActions={props.menuActions}
    buttonActions={props.buttonActions}
    kind={props.kind}
    breadcrumbsFor={props.breadcrumbsFor} />
  <HorizontalNav
    pages={props.pages}
    pagesFor={props.pagesFor}
    className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
    match={props.match}
    label={props.label || (props.kind as any).label}
    resourceKeys={_.map(props.resources, 'prop')} />
</Firehose>, ErrorBoundaryFallback);

type Page = {
  href: string;
  name: string;
  component?: React.ComponentType<any>;
};

export type DetailsPageProps = {
  match: match<any>;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  menuActions?: any[];
  buttonActions?: any[];
  pages?: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  kind: K8sResourceKindReference;
  label?: string;
  name?: string;
  namespace?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (obj: K8sResourceKind) => {name: string, path: string}[];
};

DetailsPage.displayName = 'DetailsPage';
