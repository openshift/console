import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import { connect, history } from './utils';
import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { formatNamespaceRoute } from '../ui/ui-actions';
import { authSvc } from '../module/auth';

const stripNS = href => href.replace(/^\/?(all-namespaces|ns\/[^\/]*)/, '');
const isActive = href => stripNS(history.getCurrentLocation().pathname).indexOf(stripNS(href)) === 0;

const stateToProps = state => {
  const props = featuresStateToProps(Object.keys(FLAGS), state);
  props.activeNamespace = state.UI.get('activeNamespace');
  return props;
};

const NavLink = connect(stateToProps)(
({name, href, resource, activeNamespace, flags, required=null, onClick=null}) => {
  if (required && !flags[required]) {
    return null;
  }
  const href_ = resource ? formatNamespaceRoute(activeNamespace, resource) : href;
  const klass = classNames('co-m-nav-link', {active: isActive(href_)});

  return <li className={klass} key={href_}>
    <Link to={href_} onClick={e => {
      if (onClick) {
        return onClick(e);
      }
    }}>{name}</Link>
  </li>;
});

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

export const Nav = () => <div id="sidebar" className="co-img-bg-cells">
  <div className="navigation-container">
    <div className="navigation-container__section navigation-container__section--logo">
      <Link to="/"><img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo" /></Link>
    </div>

    <div className="navigation-container__section">
      <div className="navigation-container__section__title">
        <i className="fa fa-folder-open-o navigation-container__section__title__icon"></i>Browse Cluster
      </div>
      <ul className="navigation-container__list no-margin collapse in">
        <NavLink resource="deployments" name="Deployments"/>
        <NavLink resource="services" name="Services"/>
        <NavLink resource="jobs" name="Jobs"/>
        <NavLink resource="replicasets" name="Replica Sets" />
        <NavLink resource="daemonsets" name="Daemon Sets" />
        <NavLink resource="replicationcontrollers" name="Replication Controllers" />
        <NavLink resource="horizontalpodautoscalers" name="Autoscalers" />
        <NavLink resource="pods" name="Pods" />
        <NavLink resource="serviceaccounts" name="Service Accounts" />
        <NavLink resource="configmaps" name="Config Maps" />
        <NavLink resource="secrets" name="Secrets" />
        <NavLink resource="events" name="Events" />
        <NavLink resource="search" name="Search" />
        <NavLink resource="ingresses" name="Ingress" />
      </ul>
    </div>

    <div className="navigation-container__section">
      <div className="navigation-container__section__title">
        <i className="fa fa-cog navigation-container__section__title__icon"></i>Administration
      </div>
      <ul className="navigation-container__list no-margin collapse in" id="admin-tab">
        <NavLink href="namespaces" name="Namespaces" />
        <NavLink href="nodes" name="Nodes" />
        <NavLink href="settings/cluster" name="Cluster Settings" />
        <NavLink resource="roles" required="RBAC" name="Roles" />
        <NavLink resource="rolebindings" required="RBAC" name="Role Bindings" />
        <NavLink href="clusterroles" required="RBAC" name="Cluster Roles" />
        <NavLink href="clusterrolebindings" required="RBAC" name="Cluster Role Bindings" />
      </ul>
    </div>

    { authSvc.userID() &&
      <div className="navigation-container__section">
        <div className="navigation-container__section__title">
          <i className="fa fa-user navigation-container__section__title__icon"></i>
          { authSvc.name() }
        </div>
        <ul id="account-nav" className="navigation-container__list">
          <NavLink href="settings/profile" name="My Account" />
          <NavLink href="#" name="Log Out" required="AUTH_ENABLED" onClick={logout} />
        </ul>
      </div>
    }
  </div>
</div>;
