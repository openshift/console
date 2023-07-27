import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
/* eslint-disable import/named */
import { useTranslation, withTranslation, WithTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import {
  Redirect,
  Route,
  Switch,
  Link,
  match as Match,
  matchPath,
  RouteComponentProps,
  useRouteMatch,
  useLocation,
} from 'react-router-dom';
import {
  HorizontalNavTab as DynamicResourceNavTab,
  isHorizontalNavTab as DynamicIsResourceNavTab,
  NavTab as DynamicNavTab,
  isTab as DynamicIsNavTab,
} from '@console/dynamic-plugin-sdk/src/extensions/horizontal-nav-tabs';
import { ExtensionK8sGroupModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { ErrorBoundaryPage } from '@console/shared/src/components/error';
import { K8sResourceKind, K8sResourceCommon } from '../../module/k8s';
import { referenceForModel, referenceFor, referenceForExtensionModel } from '../../module/k8s/k8s';
import { PodsPage } from '../pod';
import { AsyncComponent } from './async';
import { ResourceMetricsDashboard } from './resource-metrics';
import { EmptyBox, LoadingBox, StatusBox } from './status-box';
import {
  HorizontalNavProps as HorizontalNavFacadeProps,
  NavPage,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useExtensions, HorizontalNavTab, isHorizontalNavTab } from '@console/plugin-sdk/src';

const removeLeadingSlash = (str: string | undefined) => str?.replace(/^\//, '') || '';

export const editYamlComponent = (props) => (
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
  terminal: (component) => ({
    href: 'terminal',
    // t('public~Terminal')
    nameKey: 'public~Terminal',
    component,
  }),
};

export const NavBar: React.FC<NavBarProps> = ({ pages, baseURL, basePath }) => {
  const { t } = useTranslation();
  const { telemetryPrefix, titlePrefix } = React.useContext(PageTitleContext);
  const location = useLocation();

  basePath = basePath.replace(/\/$/, '');

  const tabs = (
    <>
      {pages.map(({ name, nameKey, href, path }) => {
        const matchURL = matchPath(location.pathname, {
          path: `${basePath}/${removeLeadingSlash(path || href)}`,
          exact: true,
        });
        const klass = classNames('co-m-horizontal-nav__menu-item', {
          'co-m-horizontal-nav-item--active': matchURL?.isExact,
        });
        return (
          <li className={klass} key={href}>
            <Link
              to={`${baseURL.replace(/\/$/, '')}/${removeLeadingSlash(href)}`}
              data-test-id={`horizontal-link-${nameKey ? nameKey.split('~')[1] : name}`}
            >
              {nameKey ? t(nameKey) : name}
            </Link>
          </li>
        );
      })}
    </>
  );

  const activePage = pages.find(({ href, path }) => {
    const matchURL = matchPath(location.pathname, {
      path: `${basePath}/${removeLeadingSlash(path || href)}`,
      exact: true,
    });
    return matchURL?.isExact;
  });

  const labelId = activePage?.nameKey?.split('~')[1] || activePage?.name || 'Details';
  return (
    <>
      <Helmet>
        <title data-telemetry={telemetryPrefix ? `${telemetryPrefix} · ${labelId}` : labelId}>
          {titlePrefix
            ? `${titlePrefix} · ${activePage?.nameKey ? t(activePage.nameKey) : activePage?.name}`
            : `${activePage?.nameKey ? t(activePage.nameKey) : activePage?.name}`}
        </title>
      </Helmet>
      <ul className="co-m-horizontal-nav__menu">{tabs}</ul>
    </>
  );
};
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
  const contextId = props.contextId;
  const dynamicResourceNavTabExtensions = useExtensions<DynamicResourceNavTab>(
    DynamicIsResourceNavTab,
  );
  const dynamicTabExtensions = useExtensions<DynamicNavTab>(DynamicIsNavTab);
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

  const dynamicPluginPages = React.useMemo(() => {
    const resolvedResourceNavTab = dynamicResourceNavTabExtensions
      .filter(
        (tab) =>
          referenceForExtensionModel(tab.properties.model as ExtensionK8sGroupModel) ===
          objReference,
      )
      .map((tab) => ({
        ...tab.properties.page,
        component: (params: PageComponentProps) => (
          <AsyncComponent {...params} loader={tab.properties.component} />
        ),
      }));

    const resolvedNavTab = dynamicTabExtensions
      .filter((tab) => tab.properties.contextId === contextId)
      .map((tab) => ({
        name: tab.properties.name,
        href: tab.properties.href,
        component: (params: PageComponentProps) => (
          <AsyncComponent {...params} loader={tab.properties.component} />
        ),
      }));

    return [...resolvedResourceNavTab, ...resolvedNavTab].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [dynamicResourceNavTabExtensions, dynamicTabExtensions, objReference, contextId]);

  const pages: Page[] = [
    ...(props.pages || props.pagesFor(props.obj?.data)),
    ...pluginPages,
    ...dynamicPluginPages,
  ];

  const routes = pages.map((p) => {
    const path = `${props.match.path}/${removeLeadingSlash(p.path || p.href)}`;
    const render = (params: RouteComponentProps) => {
      return (
        <ErrorBoundaryPage>
          <p.component
            {...params}
            {...componentProps}
            {...extraResources}
            {...p.pageData}
            customData={props.customData}
            params={params}
          />
        </ErrorBoundaryPage>
      );
    };
    return <Route path={path} exact key={p.nameKey || p.name} render={render} />;
  });
  // Handle cases where matching Routes do not exist and show the details page instead of a blank page
  if (props.createRedirect && routes.length >= 1) {
    routes.push(<Redirect key="fallback_redirect" to={routes[0].props.path} />);
  }

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
 * Component consumed by the dynamic plugin SDK
 * Changes to the underlying component has to support props used in this facade
 */
export const HorizontalNavFacade: React.FC<HorizontalNavFacadeProps> = ({ resource, pages }) => {
  const obj = { data: resource, loaded: true };
  const match = useRouteMatch();

  return <HorizontalNav obj={obj} pages={pages} match={match} noStatusBox />;
};

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
};

export type HorizontalNavProps = Omit<HorizontalNavFacadeProps, 'pages' | 'resource'> & {
  /* The facade support a limited set of properties for pages */
  match: Match<any>;
  className?: string;
  createRedirect?: boolean;
  contextId?: string;
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
