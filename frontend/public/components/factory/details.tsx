import type { ReactNode } from 'react';
import { useMemo, useState, useCallback } from 'react';
import { useLocation, useParams, Location } from 'react-router';
import * as _ from 'lodash';
import { getBadgeFromType } from '@console/shared/src/components/badges/badge-factory';
import { getTitleForNodeKind } from '@console/shared/src/utils/utils';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import withFallback from '@console/shared/src/components/error/fallbacks/withFallback';
import ErrorBoundaryFallbackPage from '@console/shared/src/components/error/fallbacks/ErrorBoundaryFallbackPage';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  isDetailPageBreadCrumbs,
  DetailPageBreadCrumbs,
} from '@console/dynamic-plugin-sdk/src/extensions/breadcrumbs';
import {
  FirehoseResult,
  K8sResourceKindReference,
  K8sResourceKind,
  K8sResourceCommon,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { HorizontalNav } from '../utils/horizontal-nav';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { Page } from '../utils/horizontal-nav';
import {
  ConnectedPageHeading,
  ConnectedPageHeadingProps,
  KebabOptionsCreator,
} from '../utils/headings';
import { FirehoseResource } from '../utils/types';
import { K8sKind } from '../../module/k8s/types';
import { breadcrumbsForDetailsPage } from '../utils/breadcrumbs';
import DetailsBreadcrumbResolver from './details-breadcrumb-resolver';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { KebabAction } from '../utils/kebab';

const useBreadCrumbsForDetailPage = (
  kindObj: K8sKind,
): ResolvedExtension<DetailPageBreadCrumbs> => {
  const [breadCrumbsExtensions, breadCrumbsResolved] = useResolvedExtensions<DetailPageBreadCrumbs>(
    isDetailPageBreadCrumbs,
  );
  return useMemo(
    () =>
      breadCrumbsResolved
        ? [...breadCrumbsExtensions].find(({ properties: { getModels } }) => {
            const models = getModels();
            return Array.isArray(models)
              ? models.findIndex((model: K8sKind) => model.kind === kindObj?.kind) !== -1
              : models.kind === kindObj?.kind;
          })
        : undefined,
    [breadCrumbsResolved, breadCrumbsExtensions, kindObj],
  );
};

export const DetailsPage = withFallback<DetailsPageProps>(({ pages = [], ...props }) => {
  const resourceKeys = _.map(props.resources, 'prop');
  const [pluginBreadcrumbs, setPluginBreadcrumbs] = useState(undefined);
  const [model] = useK8sModel(props.kind);
  const kindObj: K8sModel = props.kindObj ?? model;

  const params = useParams();
  const location = useLocation();

  const resolvedBreadcrumbExtension = useBreadCrumbsForDetailPage(kindObj);
  const onBreadcrumbsResolved = useCallback((breadcrumbs) => {
    setPluginBreadcrumbs(breadcrumbs || undefined);
  }, []);

  const allPages = pages.length ? pages : null;
  const objResource = useMemo<FirehoseResource>(
    () => ({
      kind: props.kind,
      name: props.name,
      namespace: props.namespace,
      isList: false,
      prop: 'obj',
    }),
    [props.kind, props.name, props.namespace],
  );

  const titleProviderValues = {
    telemetryPrefix: props?.kindObj?.kind,
    titlePrefix: `${props.name} · ${getTitleForNodeKind(props?.kindObj?.kind)}`,
  };

  // Build resources to watch
  const watchResources = useMemo(() => {
    const allResources = [...(_.isNil(props.obj) ? [objResource] : []), ...(props.resources ?? [])];
    return allResources.reduce((acc, r) => {
      const key = r.prop || r.kind;
      acc[key] = {
        kind: r.kind,
        name: r.name,
        namespace: r.namespace,
        isList: r.isList,
        selector: r.selector,
        fieldSelector: r.fieldSelector,
        limit: r.limit,
        namespaced: r.namespaced,
        optional: r.optional,
      };
      return acc;
    }, {} as Record<string, WatchK8sResource>);
  }, [props.obj, props.resources, objResource]);

  const watchedResources = useK8sWatchResources<
    Record<string, K8sResourceCommon | K8sResourceCommon[]>
  >(watchResources);

  const objData = _.isNil(props.obj) ? watchedResources.obj : props.obj;

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      {resolvedBreadcrumbExtension && (
        <DetailsBreadcrumbResolver
          useBreadcrumbs={resolvedBreadcrumbExtension.properties.breadcrumbsProvider}
          onBreadcrumbsResolved={onBreadcrumbsResolved}
          urlMatch={location}
          kind={kindObj}
        />
      )}

      <ConnectedPageHeading
        {...watchedResources}
        obj={objData}
        title={props.title || props.name}
        titleFunc={props.titleFunc}
        menuActions={props.menuActions}
        buttonActions={props.buttonActions}
        customActionMenu={props.customActionMenu}
        kind={props.customKind || props.kind}
        icon={props.icon}
        breadcrumbs={pluginBreadcrumbs}
        breadcrumbsFor={
          props.breadcrumbsFor ??
          (!pluginBreadcrumbs ? breadcrumbsForDetailsPage(kindObj, params, location) : undefined)
        }
        resourceKeys={resourceKeys}
        getResourceStatus={props.getResourceStatus}
        customData={props.customData}
        badge={props.badge || getBadgeFromType(kindObj?.badge)}
        OverrideTitle={props.OverrideTitle}
        helpText={props.helpText}
        helpAlert={props.helpAlert}
      />
      <HorizontalNav
        {...watchedResources}
        obj={objData as { data: K8sResourceCommon; loaded: boolean }}
        pages={allPages}
        pagesFor={props.pagesFor}
        className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
        label={props.label || kindObj?.label}
        resourceKeys={resourceKeys}
        customData={props.customData}
        createRedirect={props.createRedirect}
      />
    </PageTitleContext.Provider>
  );
}, ErrorBoundaryFallbackPage);

export type DetailsPageProps = {
  obj?: FirehoseResult<K8sResourceKind>;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  menuActions?: KebabAction[] | KebabOptionsCreator;
  buttonActions?: any[];
  createRedirect?: boolean;
  customActionMenu?: ConnectedPageHeadingProps['customActionMenu'];
  icon?: ConnectedPageHeadingProps['icon'];
  pages?: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  kind: K8sResourceKindReference;
  kindObj?: K8sKind;
  label?: string;
  name?: string;
  namespace?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (
    obj: K8sResourceKind,
  ) => ({ name: string; path: string } | { name: string; path: Location })[];
  customData?: any;
  badge?: ReactNode;
  OverrideTitle?: ConnectedPageHeadingProps['OverrideTitle'];
  getResourceStatus?: (resource: K8sResourceKind) => string;
  customKind?: string;
  helpText?: ConnectedPageHeadingProps['helpText'];
  helpAlert?: ConnectedPageHeadingProps['helpAlert'];
};

DetailsPage.displayName = 'DetailsPage';
