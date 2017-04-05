import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';

import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { formatNamespaceRoute, actions as UIActions } from '../ui/ui-actions';
import { authSvc } from '../module/auth';

const stripNS = href => href.replace(/^\/?(all-namespaces|ns\/[^\/]*)/, '');

const stateToProps = state => {
  const props = featuresStateToProps(Object.keys(FLAGS), state);
  props.activeNamespace = state.UI.get('activeNamespace');
  props.activeNavSectionId = state.UI.get('activeNavSectionId');
  props.pathname = state.UI.get('location');
  return props;
};

const actions = {openSection: UIActions.setActiveNavSectionId};

const NavLink = connect(stateToProps, actions)(
class NavLink_ extends React.Component {
  componentWillMount () {
    const {openSection, sectionId, href, resource, activeNamespace, pathname} = this.props;
    this.href_ = resource ? formatNamespaceRoute(activeNamespace, resource) : href;
    this.isActive = pathname && stripNS(pathname).indexOf(stripNS(this.href_)) === 0;
    if (this.isActive) {
      openSection(sectionId);
    }
  }

  render () {
    const {name, flags, required = null, onClick = null} = this.props;
    if (required && !flags[required]) {
      return null;
    }
    const klass = classNames('co-m-nav-link', {active: this.isActive});

    return <li className={klass} key={this.href_}>
      <Link to={this.href_} onClick={e => {
        if (onClick) {
          return onClick(e);
        }
      }}>{name}</Link>
    </li>;
  }
});

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const NavSection = ({isOpen, icon, img, text, onClick_, children}) => {
  const setListHeight = (list) => {
    if (list) {
      list.style.height = isOpen ? `${list.scrollHeight}px` : 0;
    }
  };

  return <div className="navigation-container__section">
    <div className="navigation-container__section__title" onClick={onClick_}>
      {icon && <i className={`fa ${icon} navigation-container__section__title__icon`}></i>}
      {img && <img src={img} />}
      {text}
    </div>
    <ul className="navigation-container__list" ref={setListHeight}>{children}</ul>
  </div>;
};

export const Nav = connect(stateToProps, actions)(
({activeNavSectionId, openSection, pathname}) => {
  const accordionProps = id => ({
    id,
    isOpen: id === activeNavSectionId,
    onClick_: () => openSection(id),
  });

  return (
    <div id="sidebar" className="co-img-bg-cells">
      <div className="navigation-container" key={pathname}>
        <div className="navigation-container__section navigation-container__section--logo">
          <Link to="/"><img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo" /></Link>
        </div>

        <NavSection text="Workloads" icon="fa-folder-open-o" {...accordionProps('workloads')}>
          <NavLink resource="deployments" name="Deployments" sectionId="workloads" />
          <NavLink resource="replicasets" name="Replica Sets" sectionId="workloads" />
          <NavLink resource="replicationcontrollers" name="Replication Controllers" sectionId="workloads" />
          <NavLink resource="horizontalpodautoscalers" name="Autoscalers" sectionId="workloads" />
          <div className="navigation-container__section__separator"></div>
          <NavLink resource="daemonsets" name="Daemon Sets" sectionId="workloads" />
          <NavLink resource="jobs" name="Jobs" sectionId="workloads" />
          <NavLink resource="pods" name="Pods" sectionId="workloads" />
          <NavLink resource="configmaps" name="Config Maps" sectionId="workloads" />
          <NavLink resource="secrets" name="Secrets" sectionId="workloads" />
        </NavSection>

        <NavSection text="Routing" img="static/imgs/routing.svg" {...accordionProps('routing')}>
          <NavLink resource="services" name="Services" sectionId="routing" />
          <NavLink resource="ingresses" name="Ingress" sectionId="routing" />
        </NavSection>

        <NavSection text="Troubleshooting" icon="fa-life-ring" {...accordionProps('troubleshooting')}>
          <NavLink resource="search" name="Search" sectionId="troubleshooting" />
          <NavLink resource="events" name="Events" sectionId="troubleshooting" />
        </NavSection>

        <NavSection text="Administration" icon="fa-cog" {...accordionProps('admin')}>
          <NavLink href="namespaces" name="Namespaces" sectionId="admin" />
          <NavLink href="nodes" name="Nodes" sectionId="admin" />
          <NavLink href="settings/cluster" name="Cluster Settings" sectionId="admin" />
          <NavLink resource="serviceaccounts" name="Service Accounts" sectionId="admin" />
          <NavLink resource="roles" required="RBAC" name="Roles" sectionId="admin" />
          <NavLink resource="rolebindings" required="RBAC" name="Role Bindings" sectionId="admin" />
          <NavLink href="clusterroles" required="RBAC" name="Cluster Roles" sectionId="admin" />
          <NavLink href="clusterrolebindings" required="RBAC" name="Cluster Role Bindings" sectionId="admin" />
          <NavLink href="rolebindings" required="RBAC" name="Role Bindings" sectionId="admin" />
        </NavSection>

        {authSvc.userID() && <NavSection text={authSvc.name()} icon="fa-user" {...accordionProps('account')}>
          <NavLink href="settings/profile" name="My Account" sectionId="account" />
          <NavLink href="#" name="Log Out" required="AUTH_ENABLED" onClick={logout} />
        </NavSection>}
      </div>
    </div>
  );
});
