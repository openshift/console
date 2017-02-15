import React from 'react';
import {connect} from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';

import { history } from './utils';
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

class NavSection extends React.Component {
  constructor (props) {
    super(props);
    this.state = {visible: true};
  }

  render () {
    const {icon, img, text, noToggle, children} = this.props;
    const onClick_ = noToggle ? undefined : () => this.setState({visible: !this.state.visible});

    return <div className="navigation-container__section">
      <div className="navigation-container__section__title" onClick={onClick_}>
        {icon && <i className={`fa ${icon} navigation-container__section__title__icon`}></i>}
        {img && <img src={img} />}
        {text}
      </div>
      {this.state.visible && <ul className="navigation-container__list" key={history.getCurrentLocation().pathname}>{children}</ul>}
    </div>;
  }
}

export const Nav = () => <div id="sidebar" className="co-img-bg-cells">
  <div className="navigation-container">
    <div className="navigation-container__section navigation-container__section--logo">
      <Link to="/"><img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo" /></Link>
    </div>

    <NavSection text="Workloads" icon="fa-folder-open-o">
      <NavLink resource="deployments" name="Deployments" />
      <NavLink resource="replicasets" name="Replica Sets" />
      <NavLink resource="replicationcontrollers" name="Replication Controllers" />
      <NavLink resource="horizontalpodautoscalers" name="Autoscalers" />
      <div className="navigation-container__section__separator"></div>
      <NavLink resource="daemonsets" name="Daemon Sets" />
      <NavLink resource="jobs" name="Jobs" />
      <NavLink resource="pods" name="Pods" />
      <NavLink resource="configmaps" name="Config Maps" />
      <NavLink resource="secrets" name="Secrets" />
    </NavSection>

    <NavSection text="Routing" img="static/imgs/routing.svg">
      <NavLink resource="services" name="Services" />
      <NavLink resource="ingresses" name="Ingress" />
    </NavSection>

    <NavSection text="Troubleshooting" icon="fa-life-ring">
      <NavLink resource="search" name="Search" />
      <NavLink resource="events" name="Events" />
    </NavSection>

    <NavSection text="Administration" icon="fa-cog">
      <NavLink href="namespaces" name="Namespaces" />
      <NavLink href="nodes" name="Nodes" />
      <NavLink href="settings/cluster" name="Cluster Settings" />
      <NavLink resource="serviceaccounts" name="Service Accounts" />
      <NavLink resource="roles" required="RBAC" name="Roles" />
      <NavLink resource="rolebindings" required="RBAC" name="Role Bindings" />
      <NavLink href="clusterroles" required="RBAC" name="Cluster Roles" />
      <NavLink href="clusterrolebindings" required="RBAC" name="Cluster Role Bindings" />
    </NavSection>

    {authSvc.userID() && <NavSection text={authSvc.name()} icon="fa-user" noToggle={true}>
      <NavLink href="settings/profile" name="My Account" />
      <NavLink href="#" name="Log Out" required="AUTH_ENABLED" onClick={logout} />
    </NavSection>}
  </div>
</div>;
