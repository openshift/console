import type { ComponentType } from 'react';
import { useMemo } from 'react';
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
import { AsyncComponent, type LazyLoader } from './utils/async';
import { LoadingBox } from './utils/status-box';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = (props) => Object.assign({}, _.get(props, 'params'), props);

/**
 * Wraps a plugin page loader so that a load failure falls back to the default
 * page instead of retrying with backoff for minutes. The wrapper is marked so
 * that AsyncComponent distinguishes wrappers by identity (their shared source
 * code cannot tell the wrapped loaders apart).
 */
const withDefaultPageFallback = <C extends ComponentType>(
  loader: LazyLoader<C>,
  fallback: C,
  ref: string,
): LazyLoader<C> => {
  const wrapper = async () => {
    try {
      return await loader();
    } catch (e) {
      console.warn(`Failed to load page for ${ref}, falling back to the default page`, e);
      return fallback;
    }
  };
  Object.defineProperty(wrapper, '__wrappedLoader', { value: loader });
  return wrapper;
};

const defaultListPage = () => Promise.resolve(DefaultPage);

const InnerResourceListPage = connectToPlural(
  withStartGuide((props: ResourceListPageProps) => {
    const resourceListPageExtensions = useExtensions<ResourceListPageExt>(isResourceListPage);
    const { kindObj, kindsInFlight, modelRef, noProjectsAvailable, ns, plural } = allParams(props);

    // Hook usage must precede the early returns below.
    const ref = kindObj ? referenceForModel(kindObj) : null;
    const pluginLoader =
      (ref && getResourceListPages(resourceListPageExtensions).get(ref)) || undefined;
    const componentLoader = useMemo(
      () =>
        pluginLoader ? withDefaultPageFallback(pluginLoader, DefaultPage, ref) : defaultListPage,
      // eslint-disable-next-line react-hooks-js/exhaustive-deps -- defaultListPage is a stable module-level loader
      [pluginLoader],
    );

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

  // Hook usage must precede the early return below.
  const ref =
    kindObj && location.pathname.indexOf('customresourcedefinitions') === -1
      ? referenceForModel(kindObj)
      : null;
  const detailsPages = getResourceDetailsPages(detailsPageExtensions);
  const componentLoader =
    (kindObj &&
      (detailsPages.get(ref) ||
        detailsPages.get(
          referenceForExtensionModel({
            group: kindObj.apiGroup,
            version: kindObj.apiVersion,
            kind: kindObj.kind,
          }),
        ))) ||
    undefined;
  const defaultPage = () => Promise.resolve(DefaultDetailsPage);
  const loader = useMemo(
    () =>
      componentLoader
        ? withDefaultPageFallback(componentLoader, DefaultDetailsPage, ref)
        : defaultPage,
    // eslint-disable-next-line react-hooks-js/exhaustive-deps -- defaultPage is recreated each render with identical source, which AsyncComponent treats as the same loader
    [componentLoader],
  );

  if (!name || !kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const titleProviderValues = {
    telemetryPrefix: props.kindObj?.kind,
    titlePrefix: `${props.params.name} · ${getTitleForNodeKind(props.kindObj?.kind)}`,
  };

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      <AsyncComponent
        loader={loader}
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
