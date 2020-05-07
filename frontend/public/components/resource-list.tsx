import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match } from 'react-router-dom';
import { getBadgeFromType } from '@console/shared';
import { connectToPlural } from '../kinds';
import { ErrorPage404 } from './error';
import { withStartGuide } from './start-guide';
import { AsyncComponent, LoadingBox } from './utils';
import { DefaultPage, DefaultDetailsPage } from './default-resource';
import { getResourceListPages, getResourceDetailsPages } from './resource-pages';
import {
  apiVersionForReference,
  isGroupVersionKind,
  K8sKind,
  K8sResourceKindReference,
  kindForReference,
  referenceForModel,
} from '../module/k8s';
import {
  useExtensions,
  isResourceDetailsPage,
  ResourceDetailsPage as ResourceDetailsPageExt,
  ResourceListPage as ResourceListPageExt,
  isResourceListPage,
} from '@console/plugin-sdk';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = (props) => Object.assign({}, _.get(props, 'match.params'), props);

export const ResourceListPage = connectToPlural(
  withStartGuide((props: ResourceListPageProps) => {
    const resourceListPageExtensions = useExtensions<ResourceListPageExt>(isResourceListPage);
    const { kindObj, kindsInFlight, modelRef, noProjectsAvailable, ns, plural } = allParams(props);

    if (!kindObj) {
      if (kindsInFlight) {
        return <LoadingBox />;
      }
      const missingType = isGroupVersionKind(plural)
        ? `"${kindForReference(plural)}" in "${apiVersionForReference(plural)}"`
        : `"${plural}"`;
      return (
        <ErrorPage404
          message={`The server doesn't have a resource type ${missingType}. Try refreshing the page if it was recently added.`}
        />
      );
    }
    const ref = referenceForModel(kindObj);
    const componentLoader = getResourceListPages(resourceListPageExtensions).get(ref, () =>
      Promise.resolve(DefaultPage),
    );

    return (
      <div className="co-m-list">
        <Helmet>
          <title>{kindObj.labelPlural}</title>
        </Helmet>
        <AsyncComponent
          autoFocus={!noProjectsAvailable}
          kind={modelRef}
          loader={componentLoader}
          match={props.match}
          mock={noProjectsAvailable}
          namespace={ns}
          badge={getBadgeFromType(kindObj.badge)}
        />
      </div>
    );
  }),
);

export const ResourceDetailsPage = connectToPlural((props: ResourceDetailsPageProps) => {
  const detailsPageExtensions = useExtensions<ResourceDetailsPageExt>(isResourceDetailsPage);
  const { name, ns, kindObj, kindsInFlight } = allParams(props);

  if (!name || !kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const ref =
    props.match.path.indexOf('customresourcedefinitions') === -1
      ? referenceForModel(kindObj)
      : null;
  const componentLoader = getResourceDetailsPages(detailsPageExtensions).get(ref, () =>
    Promise.resolve(DefaultDetailsPage),
  );

  return (
    <>
      <Helmet>
        <title>{`${name} · Details`}</title>
      </Helmet>
      <AsyncComponent
        loader={componentLoader}
        match={props.match}
        namespace={ns}
        kind={props.modelRef}
        kindObj={kindObj}
        name={decodeURIComponent(name)}
        badge={getBadgeFromType(kindObj.badge)}
      />
    </>
  );
});

export type ResourceListPageProps = {
  flags: any;
  kindObj: K8sKind;
  kindsInFlight: boolean;
  match: match<any>;
  modelRef: K8sResourceKindReference;
};

export type ResourceDetailsPageProps = {
  kindObj: K8sKind;
  kindsInFlight: boolean;
  match: match<any>;
  modelRef: K8sResourceKindReference;
};

ResourceListPage.displayName = 'ResourceListPage';
ResourceDetailsPage.displayName = 'ResourceDetailsPage';
