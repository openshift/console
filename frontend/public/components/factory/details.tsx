import * as React from 'react';
import { useLocation, useParams, Location } from 'react-router-dom-v5-compat';
import * as _ from 'lodash-es';
import { getBadgeFromType } from '@console/shared/src/components/badges/badge-factory';
import { getTitleForNodeKind } from '@console/shared/src/utils/utils';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import withFallback from '@console/shared/src/components/error/fallbacks/withFallback';
import ErrorBoundaryFallbackPage from '@console/shared/src/components/error/fallbacks/ErrorBoundaryFallbackPage';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  ResourceTabPage,
  isResourceTabPage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  isDetailPageBreadCrumbs,
  DetailPageBreadCrumbs,
} from '@console/dynamic-plugin-sdk/src/extensions/breadcrumbs';
import {
  FirehoseResult,
  K8sResourceKindReference,
  K8sResourceKind,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { Firehose } from '../utils/firehose';
import { HorizontalNav } from '../utils/horizontal-nav';
import type { Page } from '../utils/horizontal-nav';
import {
  ConnectedPageHeading,
  ConnectedPageHeadingProps,
  KebabOptionsCreator,
} from '../utils/headings';
import { FirehoseResource } from '../utils/types';
import { KebabAction } from '../utils/kebab';
import { K8sKind } from '../../module/k8s/types';
import { getReferenceForModel as referenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { referenceForExtensionModel } from '../../module/k8s/k8s';
import { breadcrumbsForDetailsPage } from '../utils/breadcrumbs';
import DetailsBreadcrumbResolver from './details-breadcrumb-resolver';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

const useBreadCrumbsForDetailPage = (
  kindObj: K8sKind,
): ResolvedExtension<DetailPageBreadCrumbs> => {
  const [breadCrumbsExtensions, breadCrumbsResolved] = useResolvedExtensions<DetailPageBreadCrumbs>(
    isDetailPageBreadCrumbs,
  );
  return React.useMemo(
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
  const [pluginBreadcrumbs, setPluginBreadcrumbs] = React.useState(undefined);
  const [model] = useK8sModel(props.kind);
  const kindObj: K8sModel = props.kindObj ?? model;

  const params = useParams();
  const location = useLocation();

  const [resourcePageExtensions] = useResolvedExtensions<ResourceTabPage>(isResourceTabPage);

  const pluginPages = React.useMemo(
    () => [
      /** @deprecated -- if there is a bug here, encourage `console.tab/horizontalNav` usage instead */
      ...resourcePageExtensions
        .filter((p) => {
          if (p.properties.model.version) {
            return (
              referenceForExtensionModel(p.properties.model) ===
              (kindObj ? referenceForModel(kindObj) : props.kind)
            );
          }
          return (
            p.properties.model.group === kindObj.apiGroup &&
            p.properties.model.kind === kindObj.kind
          );
        })
        .map(({ properties: { href, name, component: Component } }) => ({
          href,
          name,
          component: (cProps) => <Component {...cProps} />,
        })),
    ],
    [resourcePageExtensions, kindObj, props.kind],
  );
  const resolvedBreadcrumbExtension = useBreadCrumbsForDetailPage(kindObj);
  const onBreadcrumbsResolved = React.useCallback((breadcrumbs) => {
    setPluginBreadcrumbs(breadcrumbs || undefined);
  }, []);
  let allPages = [...pages, ...pluginPages];
  allPages = allPages.length ? allPages : null;
  const objResource: FirehoseResource = {
    kind: props.kind,
    name: props.name,
    namespace: props.namespace,
    isList: false,
    prop: 'obj',
  };
  const titleProviderValues = {
    telemetryPrefix: props?.kindObj?.kind,
    titlePrefix: `${props.name} · ${getTitleForNodeKind(props?.kindObj?.kind)}`,
  };

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

      <Firehose
        resources={[...(_.isNil(props.obj) ? [objResource] : []), ...(props.resources ?? [])]}
      >
        <ConnectedPageHeading
          obj={props.obj}
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
          obj={props.obj}
          pages={allPages}
          pagesFor={props.pagesFor}
          className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
          label={props.label || (props.kind as any).label}
          resourceKeys={resourceKeys}
          customData={props.customData}
          createRedirect={props.createRedirect}
        />
      </Firehose>
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
  badge?: React.ReactNode;
  OverrideTitle?: ConnectedPageHeadingProps['OverrideTitle'];
  getResourceStatus?: (resource: K8sResourceKind) => string;
  customKind?: string;
  helpText?: ConnectedPageHeadingProps['helpText'];
  helpAlert?: ConnectedPageHeadingProps['helpAlert'];
};

DetailsPage.displayName = 'DetailsPage';
