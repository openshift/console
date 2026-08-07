import * as _ from 'lodash';
import { useParams, useLocation } from 'react-router';
import type {
  ResourceDetailsPage as ResourceDetailsPageExt,
  ResourceListPage as ResourceListPageExt,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import {
  isResourceDetailsPage,
  isResourceListPage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { getBadgeFromType } from '@console/shared/src/components/badges/badge-factory';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { getTitleForNodeKind } from '@console/shared/src/utils/utils';
import { connectToPlural } from '../kinds';
import type { K8sKind, K8sResourceKindReference } from '../module/k8s';
import {
  apiVersionForReference,
  isGroupVersionKind,
  kindForReference,
  referenceForExtensionModel,
  referenceForModel,
} from '../module/k8s';
import { DefaultPage, DefaultDetailsPage } from './default-resource';
import { ErrorPage404 } from './error';
import { getResourceListPages } from './list-pages';
import { getResourceDetailsPages } from './resource-pages';
import { withStartGuide } from './start-guide';
import { AsyncComponent } from './utils/async';
import { LoadingBox } from './utils/status-box';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = (props) => Object.assign({}, _.get(props, 'params'), props);

const InnerResourceListPage = connectToPlural(
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
          bodyText={`The server doesn't have a resource type ${missingType}. Try refreshing the page if it was recently added.`}
        />
      );
    }
    const ref = referenceForModel(kindObj);
    const componentLoader = getResourceListPages(resourceListPageExtensions).get(ref, () =>
      Promise.resolve(DefaultPage),
    );

    return (
      <div className="co-m-list">
        <DocumentTitle>{kindObj.labelPlural}</DocumentTitle>
        <AsyncComponent
          autoFocus={!noProjectsAvailable}
          kind={modelRef}
          loader={componentLoader}
          mock={noProjectsAvailable}
          namespace={ns}
          badge={getBadgeFromType(kindObj.badge)}
        />
      </div>
    );
  }),
);

export const ResourceListPage = (props) => {
  const params = useParams();
  return <InnerResourceListPage {...props} params={params} />;
};

const InnerResourceDetailsPage = connectToPlural((props: ResourceDetailsPageProps) => {
  const detailsPageExtensions = useExtensions<ResourceDetailsPageExt>(isResourceDetailsPage);
  const location = useLocation();

  const { name, ns, kindObj, kindsInFlight } = allParams(props);
  const decodedName = decodeURIComponent(name);

  if (!name || !kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const ref =
    location.pathname.indexOf('customresourcedefinitions') === -1
      ? referenceForModel(kindObj)
      : null;
  const componentLoader =
    getResourceDetailsPages(detailsPageExtensions).get(ref) ||
    getResourceDetailsPages(detailsPageExtensions).get(
      referenceForExtensionModel({
        group: kindObj.apiGroup,
        version: kindObj.apiVersion,
        kind: kindObj.kind,
      }),
    );
  const defaultPage = () => Promise.resolve(DefaultDetailsPage);

  const titleProviderValues = {
    telemetryPrefix: props.kindObj?.kind,
    titlePrefix: `${props.params.name} · ${getTitleForNodeKind(props.kindObj?.kind)}`,
  };

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      <AsyncComponent
        loader={componentLoader || defaultPage}
        namespace={ns}
        kind={props.modelRef}
        kindObj={kindObj}
        name={decodedName}
        badge={getBadgeFromType(kindObj.badge)}
      />
    </PageTitleContext.Provider>
  );
});

export const ResourceDetailsPage = (props) => {
  const params = useParams();
  return <InnerResourceDetailsPage {...props} params={params} />;
};

type ResourceListPageProps = {
  flags: any;
  kindObj: K8sKind;
  kindsInFlight: boolean;
  params?: any;
  modelRef: K8sResourceKindReference;
};

type ResourceDetailsPageProps = {
  kindObj: K8sKind;
  kindsInFlight: boolean;
  params?: any;
  modelRef: K8sResourceKindReference;
};

ResourceListPage.displayName = 'ResourceListPage';
ResourceDetailsPage.displayName = 'ResourceDetailsPage';
