import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { History, Location } from 'history';
import { Route, Switch, Link, withRouter, match, matchPath } from 'react-router-dom';

import { EmptyBox, StatusBox } from '.';
import { PodsPage } from '../pod';
import { AsyncComponent } from './async';
import { K8sResourceKind } from '../../module/k8s';
import { referenceForModel, referenceFor } from '../../module/k8s/k8s';
import { useExtensions, HorizontalNavTab, isHorizontalNavTab } from '@console/plugin-sdk';

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

class PodsComponent extends React.PureComponent<PodsComponentProps> {
  render() {
    const {
      metadata: { namespace },
      spec: { selector },
    } = this.props.obj;
    if (_.isEmpty(selector)) {
      return <EmptyBox label="Pods" />;
    }

    // Hide the create button to avoid confusion when showing pods for an object.
    // Otherwise it might seem like you click "Create Pod" to add replicas instead
    // of scaling the owner.
    return (
      <PodsPage showTitle={false} namespace={namespace} selector={selector} canCreate={false} />
    );
  }
}

export type Page = {
  href?: string;
  path?: string;
  name: string;
  component?: React.ComponentType<PageComponentProps>;
};

type NavFactory = { [name: string]: (c?: React.ComponentType<any>) => Page };
export const navFactory: NavFactory = {
  details: (component) => ({
    href: '',
    name: 'Details',
    component,
  }),
  events: (component) => ({
    href: 'events',
    name: 'Events',
    component,
  }),
  logs: (component) => ({
    href: 'logs',
    name: 'Logs',
    component,
  }),
  editYaml: (component = editYamlComponent) => ({
    href: 'yaml',
    name: 'YAML',
    component,
  }),
  pods: (component) => ({
    href: 'pods',
    name: 'Pods',
    component: component || PodsComponent,
  }),
  roles: (component) => ({
    href: 'roles',
    name: 'Role Bindings',
    component,
  }),
  builds: (component) => ({
    href: 'builds',
    name: 'Builds',
    component,
  }),
  envEditor: (component) => ({
    href: 'environment',
    name: 'Environment',
    component,
  }),
  clusterServiceClasses: (component) => ({
    href: 'serviceclasses',
    name: 'Service Classes',
    component,
  }),
  clusterServicePlans: (component) => ({
    href: 'serviceplans',
    name: 'Service Plans',
    component,
  }),
  serviceBindings: (component) => ({
    href: 'servicebindings',
    name: 'Service Bindings',
    component,
  }),
  clusterOperators: (component) => ({
    href: 'clusteroperators',
    name: 'Cluster Operators',
    component,
  }),
  machineConfigs: (component) => ({
    href: 'machineconfigs',
    name: 'Machine Configs',
    component,
  }),
  machines: (component) => ({
    href: 'machines',
    name: 'Machines',
    component,
  }),
  workloads: (component) => ({
    href: 'workloads',
    name: 'Workloads',
    component,
  }),
  history: (component) => ({
    href: 'history',
    name: 'History',
    component,
  }),
};

export const NavBar = withRouter<NavBarProps>(({ pages, basePath }) => {
  basePath = basePath.replace(/\/$/, '');

  const tabs = (
    <>
      {pages.map(({ name, href, path }) => {
        const matchUrl = matchPath(location.pathname, {
          path: `${basePath}/${path || href}`,
          exact: true,
        });
        const klass = classNames('co-m-horizontal-nav__menu-item', {
          'co-m-horizontal-nav-item--active': matchUrl && matchUrl.isExact,
        });
        return (
          <li className={klass} key={name}>
            <Link to={`${basePath}/${href}`} data-test-id={`horizontal-link-${name}`}>
              {name}
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
    const content = <Switch> {routes} </Switch>;

    const skeletonDetails = (
      <div className="skeleton-detail-view">
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
    ..._.pick(props, ['filters', 'selected', 'match']),
    obj: _.get(props.obj, 'data'),
  };
  const extraResources = _.reduce(
    props.resourceKeys,
    (extraObjs, key) => ({ ...extraObjs, [key]: _.get(props[key], 'data') }),
    {},
  );

  const navTabExtensions = useExtensions<HorizontalNavTab>(isHorizontalNavTab).filter(
    (tab) =>
      props.obj?.data && referenceForModel(tab.properties.model) === referenceFor(props.obj.data),
  );
  const pages = (props.pages || props.pagesFor(props.obj?.data)).concat(
    navTabExtensions.map((tab) => ({
      ...tab.properties.page,
      component: (params: PageComponentProps) => (
        <AsyncComponent {...params} loader={tab.properties.loader} />
      ),
    })),
  );

  const routes = pages.map((p) => {
    const path = `${props.match.url}/${p.path || p.href}`;
    const render = (params) => {
      return (
        <p.component
          {...componentProps}
          {...extraResources}
          params={params}
          customData={props.customData}
        />
      );
    };
    return <Route path={path} exact key={p.name} render={render} />;
  });

  return (
    <div className={classNames('co-m-page__body', props.className)}>
      <div className="co-m-horizontal-nav">
        {!props.hideNav && <NavBar pages={pages} basePath={props.match.url} />}
      </div>
      {renderContent(routes)}
    </div>
  );
}, _.isEqual);

export type PodsComponentProps = {
  obj: K8sResourceKind;
};

export type NavBarProps = {
  pages: Page[];
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

export type PageComponentProps = {
  filters?: any;
  selected?: any;
  match?: any;
  obj?: K8sResourceKind;
  params?: any;
  customData?: any;
  showTitle?: boolean;
  fieldSelector?: string;
};

HorizontalNav.displayName = 'HorizontalNav';
