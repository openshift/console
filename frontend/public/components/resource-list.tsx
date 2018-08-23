/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { match } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';

import { connectToPlural } from '../kinds';
import { LoadingBox, AsyncComponent } from './utils';
import { K8sResourceKindReference, referenceForModel, K8sKind } from '../module/k8s';
import { ErrorPage404 } from './error';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { OpenShiftGettingStarted } from './start-guide';
import { resourceListPages, resourceDetailPages } from './resource-pages';
import { DefaultPage, DefaultDetailsPage } from './default-resource';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = props => Object.assign({}, _.get(props, 'match.params'), props);

const ResourceListPage_ = connectToPlural((props: ResourceListPageProps) => {
  const { flags, kindObj, kindsInFlight, modelRef, ns } = allParams(props);

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const notProjectsListPage = kindObj.labelPlural !== 'Projects';
  const isOpenShift = !flagPending(flags.OPENSHIFT) && flags.OPENSHIFT;
  const noProjectsAvailable = !flagPending(flags.PROJECTS_AVAILABLE) && !flags.PROJECTS_AVAILABLE;
  const showGettingStarted = notProjectsListPage && isOpenShift && noProjectsAvailable;

  const ref = props.match.path.indexOf('customresourcedefinitions') === -1 ? referenceForModel(kindObj) : null;
  const componentLoader = resourceListPages.get(ref, () => Promise.resolve(DefaultPage));

  return <div className="co-m-list">
    {showGettingStarted && <OpenShiftGettingStarted />}
    <Helmet>
      <title>{kindObj.labelPlural}</title>
    </Helmet>
    <AsyncComponent loader={componentLoader} match={props.match} namespace={ns} kind={modelRef} fake={showGettingStarted} />
  </div>;
});

export const ResourceListPage = connectToFlags(FLAGS.PROJECTS_AVAILABLE, FLAGS.OPENSHIFT)(ResourceListPage_);

export const ResourceDetailsPage = connectToPlural((props: ResourceDetailsPageProps) => {
  const { name, ns, kindObj, kindsInFlight } = allParams(props);

  if (!name || !kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const ref = props.match.path.indexOf('customresourcedefinitions') === -1 ? referenceForModel(kindObj) : null;
  const componentLoader = props.match.params.appName
    ? () => import('./cloud-services/clusterserviceversion-resource' /* webpackChunkName: "csv-resource" */).then(m => m.ClusterServiceVersionResourcesDetailsPage)
    : resourceDetailPages.get(ref, () => Promise.resolve(DefaultDetailsPage));

  return <React.Fragment>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    <AsyncComponent loader={componentLoader} match={props.match} namespace={ns} kind={props.modelRef} name={name} />
  </React.Fragment>;
});

export type ResourceListPageProps = {
  flags: any,
  modelRef: K8sResourceKindReference;
  match: match<any>;
  kindObj: K8sKind;
  kindsInFlight: boolean;
};

export type ResourceDetailsPageProps = {
  modelRef: K8sResourceKindReference;
  match: match<any>;
  kindObj: K8sKind;
  kindsInFlight: boolean;
};

ResourceListPage.displayName = 'ResourceListPage';
ResourceDetailsPage.displayName = 'ResourceDetailsPage';
