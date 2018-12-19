/* eslint-disable no-undef, no-unused-vars */

import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { Route, Switch, Link } from 'react-router-dom';

import { EmptyBox, StatusBox } from '.';
import { PodsPage } from '../pod';
import { AsyncComponent } from './async';
import { K8sResourceKind } from '../../module/k8s';

const editYamlComponent = (props) => <AsyncComponent loader={() => import('../edit-yaml').then(c => c.EditYAML)} obj={props.obj} />;
export const viewYamlComponent = (props) => <AsyncComponent loader={() => import('../edit-yaml').then(c => c.EditYAML)} obj={props.obj} readOnly={true} />;

class PodsComponent extends React.PureComponent<PodsComponentProps> {
  render() {
    const {metadata: {namespace}, spec: {selector}} = this.props.obj;
    if (_.isEmpty(selector)) {
      return <EmptyBox label="Pods" />;
    }

    // Hide the create button to avoid confusion when showing pods for an object.
    // Otherwise it might seem like you click "Create Pod" to add replicas instead
    // of scaling the owner.
    return <PodsPage showTitle={false} namespace={namespace} selector={selector} canCreate={false} />;
  }
}

type Page = {
  href: string;
  name: string;
  component?: React.ComponentType<any>;
};

type NavFactory = {[name: string]: (c?: React.ComponentType<any>) => Page};
export const navFactory: NavFactory = {
  details: component => ({
    href: '',
    name: 'Overview',
    component,
  }),
  events: component => ({
    href: 'events',
    name: 'Events',
    component,
  }),
  logs: component => ({
    href: 'logs',
    name: 'Logs',
    component,
  }),
  editYaml: (component = editYamlComponent) => ({
    href: 'yaml',
    name: 'YAML',
    component,
  }),
  pods: component => ({
    href: 'pods',
    name: 'Pods',
    component: component || PodsComponent,
  }),
  roles: component => ({
    href: 'roles',
    name: 'Role Bindings',
    component,
  }),
  builds: component => ({
    href: 'builds',
    name: 'Builds',
    component,
  }),
  envEditor: (component) => ({
    href: 'environment',
    name: 'Environment',
    component,
  }),
  clusterServiceClasses: component => ({
    href: 'serviceclasses',
    name: 'Service Classes',
    component,
  }),
  clusterServicePlans: component => ({
    href: 'serviceplans',
    name: 'Service Plans',
    component,
  }),
  serviceBindings: component => ({
    href: 'servicebindings',
    name: 'Service Bindings',
    component,
  }),
  clusterOperators: component => ({
    href: 'clusteroperators',
    name: 'Cluster Operators',
    component,
  }),
  machines: component => ({
    href: 'machines',
    name: 'Machines',
    component,
  }),
};

export const NavBar: React.SFC<NavBarProps> = ({pages, basePath, hideDivider}) => {
  // These tabs go before the divider
  const before = ['', 'edit', 'yaml'];
  const divider = <li className="co-m-horizontal-nav__menu-item co-m-horizontal-nav__menu-item--divider" key="_divider" />;
  basePath = basePath.replace(/\/$/, '');

  const primaryTabs = <ul className="co-m-horizontal-nav__menu-primary">{
    pages.filter(({href}, i, all) => before.includes(href) || before.includes(_.get(all[i + 1], 'href'))).map(({name, href}) => {
      const klass = classNames('co-m-horizontal-nav__menu-item', {'co-m-horizontal-nav-item--active': location.pathname.replace(basePath, '/').endsWith(`/${href}`)});
      return <li className={klass} key={name}><Link to={`${basePath}/${href}`}>{name}</Link></li>;
    })}{!hideDivider && divider}</ul>;

  const secondaryTabs = <ul className="co-m-horizontal-nav__menu-secondary">{
    pages.slice(React.Children.count(primaryTabs.props.children) - 1).map(({name, href}) => {
      const klass = classNames('co-m-horizontal-nav__menu-item', {'co-m-horizontal-nav-item--active': location.pathname.replace(basePath, '/').endsWith(`/${href}`)});
      return <li className={klass} key={name}><Link to={`${basePath}/${href}`}>{name}</Link></li>;
    })}</ul>;

  return <div className="co-m-horizontal-nav__menu">
    {primaryTabs}
    {secondaryTabs}
  </div>;
};
NavBar.displayName = 'NavBar';

export class HorizontalNav extends React.PureComponent<HorizontalNavProps> {
  static propTypes = {
    pages: PropTypes.arrayOf(PropTypes.shape({
      href: PropTypes.string,
      name: PropTypes.string,
      component: PropTypes.func,
    })),
    pagesFor: PropTypes.func,
    className: PropTypes.string,
    hideNav: PropTypes.bool,
    hideDivider: PropTypes.bool,
    match: PropTypes.shape({
      path: PropTypes.string,
    }),
  };

  render() {
    const props = this.props;

    const componentProps = {..._.pick(props, ['filters', 'selected', 'match']), obj: props.obj.data};
    const extraResources = _.reduce(props.resourceKeys, (extraObjs, key) => ({...extraObjs, [key]: props[key].data}), {});
    const pages = props.pages || props.pagesFor(props.obj.data);

    const routes = pages.map(p => {
      const path = `${props.match.url}/${p.href}`;
      const render = () => {
        return <p.component {...componentProps} {...extraResources} />;
      };
      return <Route path={path} exact key={p.name} render={render} />;
    });

    return <div className={props.className}>
      <div className="co-m-horizontal-nav">
        {!props.hideNav && <NavBar pages={pages} basePath={props.match.url} hideDivider={props.hideDivider} />}
        <StatusBox {...props.obj} EmptyMsg={props.EmptyMsg} label={props.label}>
          <Switch> {routes} </Switch>
        </StatusBox>
      </div>
    </div>;
  }
}

export type PodsComponentProps = {
  obj: K8sResourceKind;
};

export type NavBarProps = {
  pages: Page[];
  basePath: string;
  hideDivider?: boolean;
};

export type HorizontalNavProps = {
  className?: string;
  obj?: {loaded: boolean, data: K8sResourceKind};
  label?: string;
  pages: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  match: any;
  resourceKeys?: string[];
  hideNav?: boolean;
  hideDivider?: boolean;
  EmptyMsg?: React.ComponentType<any>;
};
