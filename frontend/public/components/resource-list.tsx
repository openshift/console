import * as React from 'react';
import { match } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';

import { resourceListPages, resourceDetailPages } from './resource-pages';
import { connectToPlural } from '../kinds';
import { LoadingBox } from './utils';
import { K8sResourceKindReference, referenceForModel } from '../module/k8s';
import { ErrorPage404 } from './error';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { OpenShiftGettingStarted } from './start-guide';

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

  let PageComponent = resourceListPages.get(referenceForModel(kindObj));
  if (!PageComponent) {
    PageComponent = resourceListPages.get('Default');
  }
  return <div className="co-m-list">
    {showGettingStarted && <OpenShiftGettingStarted />}
    <Helmet>
      <title>{kindObj.labelPlural}</title>
    </Helmet>
    {PageComponent && <PageComponent fake={showGettingStarted} flags={flags} kind={modelRef} match={props.match} namespace={ns} />}
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

  let PageComponent = resourceDetailPages.get(referenceForModel(kindObj));

  if (props.match.params.appName) {
    PageComponent = resourceDetailPages.get('ClusterServiceVersionResources');
  }

  if (!PageComponent) {
    PageComponent = resourceDetailPages.get('Default');
  }
  return <div>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={props.modelRef} name={name} />}
  </div>;
});

/* eslint-disable no-undef, no-unused-vars */
export type ResourceListPageProps = {
  flags: any,
  modelRef: K8sResourceKindReference;
  match: match<any>;
};

export type ResourceDetailsPageProps = {
  modelRef: K8sResourceKindReference;
  match: match<any>;
};
/* eslint-enable no-undef, no-unused-vars */

ResourceListPage.displayName = 'ResourceListPage';
ResourceDetailsPage.displayName = 'ResourceDetailsPage';
