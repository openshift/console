import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';

import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { formatNamespaceRoute, UIActions } from '../ui/ui-actions';
import { authSvc } from '../module/auth';

import { ClusterPicker } from './federation/cluster-picker';
const stripNS = href => href.replace(/^\/?(all-namespaces|ns\/[^\/]*)/, '').replace(/^\//, '');

const areStatesEqual = (next, previous) => {
  return next.UI.get('activeNamespace') === previous.UI.get('activeNamespace') &&
    next.UI.get('location') === previous.UI.get('location') &&
    next.FLAGS.equals(previous.FLAGS);
};

const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign({}, ownProps, stateProps, dispatchProps);
const navLinkStateToProps = (state, {required, resource, href, isActive}) => {
  const activeNamespace = state.UI.get('activeNamespace');
  const pathname = state.UI.get('location');
  const resourcePath = pathname ? stripNS(pathname) : '';
  href = resource ? formatNamespaceRoute(activeNamespace, resource) : href;

  const props = {
    canRender: required ? featuresStateToProps(Object.keys(FLAGS), state).flags[required] : true,
    href,
    isActive: isActive ? isActive(resourcePath) : _.startsWith(resourcePath, stripNS(href)),
  };

  return props;
};

const actions = {openSection: UIActions.setActiveNavSectionId};

const NavLink = connect(navLinkStateToProps, actions, mergeProps, {pure: true, areStatesEqual})(
class NavLink_ extends React.PureComponent {
  componentWillMount () {
    const {isActive, openSection, sectionId} = this.props;
    if (isActive) {
      openSection(sectionId);
    }
  }

  render () {
    if (!this.props.canRender) {
      return null;
    }

    const {isActive, href, name, onClick = undefined} = this.props;
    const klass = classNames('co-m-nav-link', {active: isActive});

    return <li className={klass} key={href}>
      <Link to={href} onClick={onClick}>{name}</Link>
    </li>;
  }
});

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const navSectionStateToProps = (state, {text, required}) => {
  let canRender = true;
  if (required) {
    canRender = _.some(required, r => featuresStateToProps(Object.keys(FLAGS), state).flags[r]);
  }
  return {
    isOpen: state.UI.get('activeNavSectionId') === text,
    canRender,
  };
};

const setListHeight = (isOpen, node) => {
  if (node) {
    node.style.height = isOpen ? `${node.scrollHeight}px` : 0;
  }
};

const NavSection = connect(navSectionStateToProps, actions)(function NavSection_({isOpen, icon, img, text, openSection, children, canRender}) {
  if (!canRender) {
    return null;
  }
  const Children = React.Children.map(children, c => React.cloneElement(c, {sectionId: text, key: c.props.name}));
  return <div className="navigation-container__section">
    <div className="navigation-container__section__title" onClick={() => openSection(text)}>
      {icon && <i className={`fa ${icon} navigation-container__section__title__icon`}></i>}
      {img && <img src={img} />}
      {text}
    </div>
    <ul className="navigation-container__list" ref={function(node) {setListHeight(isOpen, node);}}>{Children}</ul>
  </div>;
});

const isRolesActive = path => _.startsWith(path, 'roles') || _.startsWith(path, 'clusterroles');
const isRoleBindingsActive = path => _.startsWith(path, 'rolebindings') || _.startsWith(path, 'clusterrolebindings');
const isClusterSettingsActive = path => _.startsWith(path, 'settings/cluster') || _.startsWith(path, 'settings/ldap');

const Sep = () => <div className="navigation-container__section__separator" />;

export const Nav = () => <div id="sidebar" className="co-img-bg-cells">
  <div className="navigation-container">
    <div className="navigation-container__section navigation-container__section--logo">
      <Link to="/"><img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo" /></Link>
      <ClusterPicker />
    </div>

    <NavSection text="Workloads" icon="fa-folder-open-o">
      <NavLink resource="daemonsets" name="Daemon Sets" />
      <NavLink resource="deployments" name="Deployments" />
      <NavLink resource="replicasets" name="Replica Sets" />
      <NavLink resource="replicationcontrollers" name="Replication Controllers" />
      <Sep />
      <NavLink resource="jobs" name="Jobs" />
      <NavLink resource="pods" name="Pods" />
      <NavLink resource="configmaps" name="Config Maps" />
      <NavLink resource="secrets" name="Secrets" />
    </NavSection>

    <NavSection required={['ETCD_OPERATOR', 'PROMETHEUS']} text="Operators" img="static/imgs/operator-logo.svg">
      <NavLink resource="etcdclusters" name="etcd Clusters" required="ETCD_OPERATOR" />
      <NavLink resource="prometheuses" name="Prometheus Instances" required="PROMETHEUS" />
    </NavSection>

    <NavSection text="Routing" img="static/imgs/routing.svg">
      <NavLink resource="ingresses" name="Ingress" />
      <NavLink resource="networkpolicies" name="Network Policies" />
      <NavLink resource="services" name="Services" />
    </NavSection>

    <NavSection text="Troubleshooting" icon="fa-life-ring">
      <NavLink resource="search" name="Search" />
      <NavLink resource="events" name="Events" />
    </NavSection>

    <NavSection text="Administration" icon="fa-cog">
      <NavLink href="namespaces" name="Namespaces" />
      <NavLink href="nodes" name="Nodes" />
      <NavLink href="settings/cluster" name="Cluster Settings" isActive={isClusterSettingsActive} />
      <NavLink resource="serviceaccounts" name="Service Accounts" />
      <NavLink resource="roles" name="Roles" required="RBAC" isActive={isRolesActive} />
      <NavLink resource="rolebindings" name="Role Bindings" required="RBAC" isActive={isRoleBindingsActive} />
    </NavSection>

    {authSvc.userID() && <NavSection text={authSvc.name()} icon="fa-user">
      <NavLink href="settings/profile" name="My Account" />
      <NavLink href="#" name="Log Out" required="AUTH_ENABLED" onClick={logout} />
    </NavSection>}
  </div>
</div>;
