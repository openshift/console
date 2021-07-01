import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { History, Location } from 'history';
import { useTranslation } from 'react-i18next';
import { Route, Switch, Link, withRouter, match, matchPath } from 'react-router-dom';

import { EmptyBox, LoadingBox, StatusBox } from './status-box';
import { PodsPage } from '../pod';
import { AsyncComponent } from './async';
import { K8sResourceKind, K8sResourceCommon } from '../../module/k8s';
import { referenceForModel, referenceFor } from '../../module/k8s/k8s';
import { useExtensions, HorizontalNavTab, isHorizontalNavTab } from '@console/plugin-sdk';
import { ResourceMetricsDashboard } from './resource-metrics';

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

export class PodsComponent extends React.PureComponent<PodsComponentProps> {
  render() {
    const {
      metadata: { namespace },
      spec: { selector },
    } = this.props.obj;
    const { customData } = this.props;
    if (_.isEmpty(selector)) {
      return <EmptyBox label="Pods" />;
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
        customData={customData}
      />
    );
  }
}

export type Page = {
  href?: string;
  path?: string;
  name?: string;
  nameKey?: string;
  component?: React.ComponentType<PageComponentProps>;
  badge?: React.ReactNode;
  pageData?: any;
};

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
  clusterServiceClasses: (component) => ({
    href: 'serviceclasses',
    // t('public~ServiceClasses')
    nameKey: 'public~ServiceClasses',
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
          <li className={klass} key={nameKey || name}>
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

  const pages = (props.pages || props.pagesFor(props.obj?.data)).concat(pluginPages);

  const routes = pages.map((p) => {
    const path = `${props.match.path}/${p.path || p.href}`;
    const render = (params) => {
      return (
        <p.component
          {...componentProps}
          {...extraResources}
          {...p.pageData}
          params={params}
          customData={props.customData}
        />
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

export type PodsComponentProps = {
  obj: K8sResourceKind;
  customData?: any;
};

export type NavBarProps = {
  pages: Page[];
  baseURL: string;
  basePath: string;
  history: History;
  location: Location<any>;
  match: match<any>;
};

export type HorizontalNavProps = {
  className?: string;
  obj?: { loaded: boolean; data: K8sResourceKind };
  label?: string;
  pages: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  match: any;
  resourceKeys?: string[];
  hideNav?: boolean;
  EmptyMsg?: React.ComponentType<any>;
  noStatusBox?: boolean;
  customData?: any;
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

HorizontalNav.displayName = 'HorizontalNav';
