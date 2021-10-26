import * as React from 'react';
import * as _ from 'lodash-es';

import { getBadgeFromType } from '@console/shared';
import {
  useExtensions,
  ResourceTabPage,
  isResourceTabPage,
  isDetailPageBreadCrumbs,
  DetailPageBreadCrumbs,
} from '@console/plugin-sdk';
import {
  ResolvedExtension,
  useResolvedExtensions,
  ResourceTabPage as DynamicResourceTabPage,
  isResourceTabPage as isDynamicResourceTabPage,
  DetailsPageProps as DynamicDetailsPageProps,
  K8sModel,
  Page,
} from '@console/dynamic-plugin-sdk';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import {
  Firehose,
  HorizontalNav,
  PageHeading,
  FirehoseResource,
  AsyncComponent,
  PageComponentProps,
} from '../utils';
import {
  K8sKind,
  referenceForModel,
  referenceFor,
  referenceForExtensionModel,
  K8sResourceKind,
} from '../../module/k8s';
import { ErrorBoundaryFallback } from '../error';
import { breadcrumbsForDetailsPage } from '../utils/breadcrumbs';
import DetailsBreadcrumbResolver from './details-breadcrumb-resolver';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

const useBreadCrumbsForDetailPage = (
  modelResource: K8sModel,
): ResolvedExtension<DetailPageBreadCrumbs> => {
  const [breadCrumbsExtension, breadCrumbsResolved] = useResolvedExtensions<DetailPageBreadCrumbs>(
    isDetailPageBreadCrumbs,
  );
  return React.useMemo(
    () =>
      breadCrumbsResolved
        ? breadCrumbsExtension.find(({ properties: { getModels } }) => {
            const models = getModels();
            return Array.isArray(models)
              ? models.findIndex((model: K8sKind) => model.kind === modelResource?.kind) !== -1
              : models.kind === modelResource?.kind;
          })
        : undefined,
    [breadCrumbsResolved, breadCrumbsExtension, modelResource],
  );
};

export type DetailsPageProps = DynamicDetailsPageProps & {
  // Following props can be migrated one-by-one into dynamic-sdk's DetailsPageProps
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  buttonActions?: any[];
  customActionMenu?:
    | React.ReactNode
    | ((kindObj: K8sKind, obj: K8sResourceKind) => React.ReactNode); // Renders a custom action menu.
  pagesFor?: (obj: K8sResourceKind) => Page[];
  label?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  customData?: any;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ obj: K8sResourceKind }>;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  children?: React.ReactNode;
  customKind?: string;
};

export const DetailsPage = withFallback<DetailsPageProps>(({ pages = [], ...props }) => {
  const resourceKeys = _.map(props.resources, 'prop');
  const [pluginBreadcrumbs, setPluginBreadcrumbs] = React.useState(undefined);
  const [model] = useK8sModel(props.kind);
  // const kindObj = props.kindObj ?? model;
  const renderAsyncComponent = (page: ResourceTabPage, cProps: PageComponentProps) => (
    <AsyncComponent loader={page.properties.loader} {...cProps} />
  );

  const resourcePageExtensions = useExtensions<ResourceTabPage>(isResourceTabPage);
  const [dynamicResourcePageExtensions] = useResolvedExtensions<DynamicResourceTabPage>(
    isDynamicResourceTabPage,
  );

  const pluginPages = React.useMemo(
    () => [
      ...resourcePageExtensions
        .filter(
          (p) =>
            referenceForModel(p.properties.model) === (model ? referenceFor(model) : props.kind),
        )
        .map((p) => ({
          href: p.properties.href,
          name: p.properties.name,
          component: (cProps) => renderAsyncComponent(p, cProps),
        })),
      ...dynamicResourcePageExtensions
        .filter((p) => {
          if (p.properties.model.version) {
            return (
              referenceForExtensionModel(p.properties.model) ===
              (model ? referenceFor(model) : props.kind)
            );
          }
          return (
            p.properties.model.group === model.apiGroup && p.properties.model.kind === model.kind
          );
        })
        .map(({ properties: { href, name, component: Component } }) => ({
          href,
          name,
          component: (cProps) => <Component {...cProps} />,
        })),
    ],
    [resourcePageExtensions, dynamicResourcePageExtensions, model, props.kind],
  );
  const resolvedBreadcrumbExtension = useBreadCrumbsForDetailPage(model);
  const onBreadcrumbsResolved = React.useCallback((breadcrumbs) => {
    setPluginBreadcrumbs(breadcrumbs || undefined);
  }, []);
  let allPages = [...pages, ...pluginPages];
  allPages = allPages.length ? allPages : null;

  return (
    <>
      {resolvedBreadcrumbExtension && (
        <DetailsBreadcrumbResolver
          useBreadcrumbs={resolvedBreadcrumbExtension.properties.breadcrumbsProvider}
          onBreadcrumbsResolved={onBreadcrumbsResolved}
          urlMatch={props.match}
          kind={model}
        />
      )}
      <Firehose
        resources={[
          {
            kind: props.kind,
            // kindObj,
            name: props.name,
            namespace: props.namespace,
            isList: false,
            prop: 'obj',
          } as FirehoseResource,
        ].concat(props.resources || [])}
      >
        <PageHeading
          detail={true}
          title={props.title || props.name}
          titleFunc={props.titleFunc}
          menuActions={props.menuActions}
          buttonActions={props.buttonActions}
          customActionMenu={props.customActionMenu}
          kind={props.customKind || props.kind}
          breadcrumbs={pluginBreadcrumbs}
          breadcrumbsFor={
            props.breadcrumbsFor ??
            (!pluginBreadcrumbs ? breadcrumbsForDetailsPage(model, props.match) : undefined)
          }
          resourceKeys={resourceKeys}
          getResourceStatus={props.getResourceStatus}
          customData={props.customData}
          badge={props.badge || getBadgeFromType(model?.badge)}
          icon={props.icon}
        >
          {props.children}
        </PageHeading>
        <HorizontalNav
          pages={allPages}
          pagesFor={props.pagesFor}
          className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
          match={props.match}
          label={props.label || (props.kind as any).label}
          resourceKeys={resourceKeys}
          customData={props.customData}
        />
      </Firehose>
    </>
  );
}, ErrorBoundaryFallback);

DetailsPage.displayName = 'DetailsPage';
