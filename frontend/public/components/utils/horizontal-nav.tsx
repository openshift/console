import * as React from 'react';
import * as classNames from 'classnames';
import { History, Location } from 'history';
import * as _ from 'lodash-es';
/* eslint-disable import/named */
import { useTranslation, withTranslation, WithTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import {
  Route,
  Switch,
  Link,
  withRouter,
  match as Match,
  matchPath,
  RouteComponentProps,
} from 'react-router-dom';
import {
  useResolvedExtensions,
  HorizontalNavTab as DynamicHorizontalNavTab,
  isHorizontalNavTab as DynamicIsHorizontalNavTab,
  ExtensionK8sGroupModel,
} from '@console/dynamic-plugin-sdk';
import { ErrorBoundary } from '@console/shared/src/components/error/error-boundary';
import { K8sResourceKind, K8sResourceCommon } from '../../module/k8s';
import { referenceForModel, referenceFor, referenceForExtensionModel } from '../../module/k8s/k8s';
import { ErrorBoundaryFallback } from '../error';
import { PodsPage } from '../pod';
import { AsyncComponent } from './async';
import { ResourceMetricsDashboard } from './resource-metrics';
import { EmptyBox, LoadingBox, StatusBox } from './status-box';
import {
  HorizontalNavProps as HorizontalNavFacadeProps,
  NavPage,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useExtensions, HorizontalNavTab, isHorizontalNavTab } from '@console/plugin-sdk/src';

const editYamlComponent = (props) => (
  <AsyncComponent loader={() => import('../edit-yaml').then((c) => c.EditYAML)} obj={props.obj} />
);
export const viewYamlComponent = (props) => (
  <AsyncComponent
    loader={() => import('../edit-yaml').then((c) => c.EditYAML)}
    obj={props.obj}
    readOnly={true}
  />
);

class PodsComponentWithTranslation extends React.PureComponent<
  PodsComponentProps & WithTranslation
> {
  render() {
    const {
      metadata: { namespace },
      spec: { selector },
    } = this.props.obj;
    const { showNodes, t } = this.props;
    if (_.isEmpty(selector)) {
      return <EmptyBox label={t('public~Pods')} />;
    }

    // Hide the create button to avoid confusion when showing pods for an object.
    // Otherwise it might seem like you click "Create Pod" to add replicas instead
    // of scaling the owner.
    return (
      <PodsPage
        showTitle={false}
        namespace={namespace}
        selector={selector}
        canCreate={false}
        showNodes={showNodes}
      />
    );
  }
}

export const PodsComponent = withTranslation()(PodsComponentWithTranslation);

type NavFactory = { [name: string]: (c?: React.ComponentType<any>) => Page };
export const navFactory: NavFactory = {
  details: (component) => ({
    href: '',
    // t('public~Details')
    nameKey: 'public~Details',
    component,
  }),
  events: (component) => ({
    href: 'events',
    // t('public~Events')
    nameKey: 'public~Events',
    component,
  }),
  logs: (component) => ({
    href: 'logs',
    // t('public~Logs')
    nameKey: 'public~Logs',
    component,
  }),
  editYaml: (component) => ({
    href: 'yaml',
    // t('public~YAML')
    nameKey: 'public~YAML',
    component: component || editYamlComponent,
  }),
  pods: (component) => ({
    href: 'pods',
    // t('public~Pods')
    nameKey: 'public~Pods',
    component: component || PodsComponent,
  }),
  jobs: (component) => ({
    href: 'jobs',
    // t('public~Jobs')
    nameKey: 'public~Jobs',
    component,
  }),
  roles: (component) => ({
    href: 'roles',
    // t('public~RoleBindings')
    nameKey: 'public~RoleBindings',
    component,
  }),
  builds: (component) => ({
    href: 'builds',
    // t('public~Builds')
    nameKey: 'public~Builds',
    component,
  }),
  envEditor: (component) => ({
    href: 'environment',
    // t('public~Environment')
    nameKey: 'public~Environment',
    component,
  }),
  clusterServicePlans: (component) => ({
    href: 'serviceplans',
    // t('public~ServicePlans')
    nameKey: 'public~ServicePlans',
    component,
  }),
  serviceBindings: (component) => ({
    href: 'servicebindings',
    // t('public~ServiceBindings')
    nameKey: 'public~ServiceBindings',
    component,
  }),
  clusterOperators: (component) => ({
    href: 'clusteroperators',
    // t('public~Cluster Operators')
    nameKey: 'public~Cluster Operators',
    component,
  }),
  machineConfigs: (component) => ({
    href: 'machineconfigs',
    // t('public~MachineConfigs')
    nameKey: 'public~MachineConfigs',
    component,
  }),
  machines: (component) => ({
    href: 'machines',
    // t('public~Machines')
    nameKey: 'public~Machines',
    component,
  }),
  workloads: (component) => ({
    href: 'workloads',
    // t('public~Workloads')
    nameKey: 'public~Workloads',
    component,
  }),
  history: (component) => ({
    href: 'history',
    // t('public~History')
    nameKey: 'public~History',
    component,
  }),
  metrics: (component) => ({
    href: 'metrics',
    // t('public~Metrics')
    nameKey: 'public~Metrics',
    component: component ?? ResourceMetricsDashboard,
  }),
};

export const NavBar = withRouter<NavBarProps>(({ pages, baseURL, basePath }) => {
  const { t } = useTranslation();
  basePath = basePath.replace(/\/$/, '');

  const tabs = (
    <>
      {pages.map(({ name, nameKey, href, path }) => {
        const matchURL = matchPath(location.pathname, {
          path: `${basePath}/${path || href}`,
          exact: true,
        });
        const klass = classNames('co-m-horizontal-nav__menu-item', {
          'co-m-horizontal-nav-item--active': matchURL?.isExact,
        });
        return (
          <li className={klass} key={href}>
            <Link
              to={`${baseURL.replace(/\/$/, '')}/${href}`}
              data-test-id={`horizontal-link-${nameKey || name}`}
            >
              {nameKey ? t(nameKey) : name}
            </Link>
          </li>
        );
      })}
    </>
  );

  return <ul className="co-m-horizontal-nav__menu">{tabs}</ul>;
});
NavBar.displayName = 'NavBar';

export const HorizontalNav = React.memo((props: HorizontalNavProps) => {
  const renderContent = (routes: JSX.Element[]) => {
    const { noStatusBox, obj, EmptyMsg, label } = props;
    const content = (
      <React.Suspense fallback={<LoadingBox />}>
        <Switch>{routes}</Switch>
      </React.Suspense>
    );

    const skeletonDetails = (
      <div data-test="skeleton-detail-view" className="skeleton-detail-view">
        <div className="skeleton-detail-view--head" />
        <div className="skeleton-detail-view--grid">
          <div className="skeleton-detail-view--column">
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-resource" />
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-labels" />
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-resource" />
          </div>
          <div className="skeleton-detail-view--column">
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-resource" />
            <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
          </div>
        </div>
      </div>
    );

    if (noStatusBox) {
      return content;
    }

    return (
      <StatusBox skeleton={skeletonDetails} {...obj} EmptyMsg={EmptyMsg} label={label}>
        {content}
      </StatusBox>
    );
  };

  const componentProps = {
    ..._.pick(props, ['filters', 'selected', 'match', 'loaded']),
    obj: _.get(props.obj, 'data'),
  };
  const extraResources = _.reduce(
    props.resourceKeys,
    (extraObjs, key) => ({ ...extraObjs, [key]: _.get(props[key], 'data') }),
    {},
  );

  const objReference = props.obj?.data ? referenceFor(props.obj.data) : '';
  const [dynamicNavTabExtensions, navTabExtentionsResolved] = useResolvedExtensions<
    DynamicHorizontalNavTab
  >(DynamicIsHorizontalNavTab);
  const navTabExtensions = useExtensions<HorizontalNavTab>(isHorizontalNavTab);

  const pluginPages = React.useMemo(
    () =>
      navTabExtensions
        .filter((tab) => referenceForModel(tab.properties.model) === objReference)
        .map((tab) => ({
          ...tab.properties.page,
          component: (params: PageComponentProps) => (
            <AsyncComponent {...params} loader={tab.properties.loader} />
          ),
        })),
    [navTabExtensions, objReference],
  );

  const dynamicPluginPages = React.useMemo(
    () =>
      navTabExtentionsResolved
        ? dynamicNavTabExtensions
            .filter(
              (tab) =>
                referenceForExtensionModel(tab.properties.model as ExtensionK8sGroupModel) ===
                objReference,
            )
            .map((tab) => ({
              ...tab.properties.page,
              component: tab.properties.component,
            }))
        : [],
    [dynamicNavTabExtensions, navTabExtentionsResolved, objReference],
  );

  const pages: Page[] = [
    ...(props.pages || props.pagesFor(props.obj?.data)),
    ...pluginPages,
    ...dynamicPluginPages,
  ];

  const routes = pages.map((p) => {
    const path = `${props.match.path}/${p.path || p.href}`;
    const render = (params: RouteComponentProps) => {
      return (
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
          <p.component
            {...params}
            {...componentProps}
            {...extraResources}
            {...p.pageData}
            customData={props.customData}
          />
        </ErrorBoundary>
      );
    };
    return <Route path={path} exact key={p.nameKey || p.name} render={render} />;
  });

  return (
    <div className={classNames('co-m-page__body', props.className)}>
      <div className="co-m-horizontal-nav">
        {!props.hideNav && (
          <NavBar pages={pages} baseURL={props.match.url} basePath={props.match.path} />
        )}
      </div>
      {renderContent(routes)}
    </div>
  );
}, _.isEqual);

/*
 *Component consumed by the dynamic plugin SDK
 * Changes to the underlying component has to support props used in this facade
 */
export const HorizontalNavFacade = withRouter<HorizontalNavFacadeProps & RouteComponentProps>(
  ({ resource, pages, match }) => {
    const obj = { data: resource, loaded: true };

    return <HorizontalNav obj={obj} pages={pages} match={match} noStatusBox />;
  },
);

export type PodsComponentProps = {
  obj: K8sResourceKind;
  showNodes?: boolean;
  t: TFunction;
};

export type PageComponentProps<R extends K8sResourceCommon = K8sResourceKind> = {
  filters?: any;
  selected?: any;
  match?: any;
  obj?: R;
  params?: any;
  customData?: any;
  showTitle?: boolean;
  fieldSelector?: string;
};

export type Page<D = any> = Partial<Omit<NavPage, 'component'>> & {
  component?: React.ComponentType<PageComponentProps & D>;
  badge?: React.ReactNode;
  pageData?: D;
  nameKey?: string;
};

export type NavBarProps = {
  pages: Page[];
  baseURL: string;
  basePath: string;
  history: History;
  location: Location<any>;
  match: Match<any>;
};

export type HorizontalNavProps = Omit<HorizontalNavFacadeProps, 'pages' | 'resource'> & {
  /* The facade support a limited set of properties for pages */
  match: Match<any>;
  className?: string;
  pages: Page[];
  label?: string;
  obj?: { data: K8sResourceCommon; loaded: boolean };
  pagesFor?: (obj: K8sResourceKind) => Page[];
  resourceKeys?: string[];
  hideNav?: boolean;
  EmptyMsg?: React.ComponentType<any>;
  customData?: any;
  noStatusBox?: boolean;
};

HorizontalNav.displayName = 'HorizontalNav';
HorizontalNavFacade.displayName = 'HorizontalNavFacade';
