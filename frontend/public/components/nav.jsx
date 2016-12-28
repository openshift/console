import React from 'react';
import classNames from 'classnames';

import { angulars, register } from './react-wrapper';
import { connect} from './utils';
import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { formatNamespaceRoute } from '../ui/ui-actions';
import { authSvc } from '../module/auth';


const stripNS = href => href.replace(/^\/?(all-namespaces|ns\/[^\/]*)/, '');
const isActive = href => stripNS(location.pathname).indexOf(stripNS(href)) >= 0;

const stateToProps = state => {
  const props = featuresStateToProps(Object.keys(FLAGS), state);
  props.activeNamespace = state.UI.get('activeNamespace');
  props.location = state.UI.location;
  return props;
};

const Link = connect(stateToProps)(
({name, href, resource, activeNamespace, flags, required=null, onClick=null}) => {
  if (required && !flags[required]) {
    return null;
  }
  const href_ = resource ? formatNamespaceRoute(activeNamespace, resource) : href;
  const klass = classNames('co-m-nav-link', {active: isActive(href_)});

  return <li className={klass} key={href_}>
    <a href={href_} onClick={e=> {
      if (onClick) {
        return onClick(e);
      }
      e.preventDefault();
      angulars.$location.path(href_);
    }}>{name}</a>
  </li>;
});

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const Nav = () => <div className="co-img-bg-cells">
  <div className="navigation-container">
    <div className="navigation-container__section navigation-container__section--logo">
      <a href="."><img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo"/></a>
    </div>

    <div className="navigation-container__section">
      <div className="navigation-container__section__title">
        <i className="fa fa-folder-open-o navigation-container__section__title__icon"></i>Browse Cluster
      </div>
      <ul className="navigation-container__list no-margin collapse in">
        <Link resource="deployments" name="Deployments"/>
        <Link resource="services" name="Services"/>
        <Link resource="jobs" name="Jobs"/>
        <Link resource="replicasets" name="Replica Sets" />
        <Link resource="daemonsets" name="Daemon Sets" />
        <Link resource="replicationcontrollers" name="Replication Controllers" />
        <Link resource="horizontalpodautoscalers" name="Autoscalers" />
        <Link resource="pods" name="Pods" />
        <Link resource="serviceaccounts" name="Service Accounts" />
        <Link resource="configmaps" name="Config Maps" />
        <Link resource="secrets" name="Secrets" />
        <Link resource="events" name="Events" />
        <Link resource="search" name="Search" />
        <Link resource="ingresses" name="Ingress" />
      </ul>
    </div>

    <div className="navigation-container__section">
      <div className="navigation-container__section__title">
        <i className="fa fa-cog navigation-container__section__title__icon"></i>Administration
      </div>
      <ul className="navigation-container__list no-margin collapse in" id="admin-tab">
        <Link href="namespaces" name="Namespaces" />
        <Link href="nodes" name="Nodes" />
        <Link href="settings/cluster" name="Cluster Settings" />
        <Link resource="roles" required="RBAC" name="Roles" />
        <Link resource="rolebindings" required="RBAC" name="Role Bindings" />
        <Link href="clusterroles" required="RBAC" name="Cluster Roles" />
        <Link href="clusterrolebindings" required="RBAC" name="Cluster Role Bindings" />
      </ul>
    </div>

    { authSvc.userID() &&
      <div className="navigation-container__section">
        <div className="navigation-container__section__title">
          <i className="fa fa-user navigation-container__section__title__icon"></i>
          { authSvc.name() }
        </div>
        <ul id="account-nav" className="navigation-container__list">
          <Link href="settings/profile" name="My Account" />
          <Link href="#" name="Log Out" required="AUTH_ENABLED" onClick={logout} />
        </ul>
      </div>
    }
  </div>
</div>;

register('Nav', Nav);

