import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';
import { match } from 'react-router-dom';

import { resourceListPages, resourceDetailPages } from './resource-pages';
import { connectToPlural } from '../kinds';
import { LoadingBox } from './utils';
import { K8sResourceKindReference, referenceForModel } from '../module/k8s';
import { ErrorPage404 } from './error';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = props => Object.assign({}, _.get(props, 'match.params'), props);

export const ResourceListPage = connectToPlural((props: ResourceListPageProps) => {
  const { ns, kindObj, kindsInFlight } = allParams(props);

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  let PageComponent = resourceListPages.get(referenceForModel(kindObj));
  if (!PageComponent) {
    PageComponent = resourceListPages.get('Default');
  }
  return <div className="co-m-list">
    <Helmet>
      <title>{kindObj.labelPlural}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={props.modelRef} />}
  </div>;
});

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
