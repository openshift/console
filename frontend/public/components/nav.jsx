import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';

import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { formatNamespaceRoute, actions as UIActions } from '../ui/ui-actions';
import { SafetyFirst } from './safety-first';
import { authSvc } from '../module/auth';
import { coFetchJSON } from '../co-fetch';

import { ClusterPicker } from './federation/cluster-picker';
const stripNS = href => href.replace(/^\/?(all-namespaces|ns\/[^\/]*)/, '').replace(/^\//, '');

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
    const {openSection, sectionId, href, isActive, resource, activeNamespace, pathname} = this.props;
    const resourcePath = pathname ? stripNS(pathname) : '';
    this.href_ = resource ? formatNamespaceRoute(activeNamespace, resource) : href;
    this.isActive = isActive ? isActive(resourcePath) : _.startsWith(resourcePath, stripNS(this.href_));
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

const isRolesActive = path => _.startsWith(path, 'roles') || _.startsWith(path, 'clusterroles');
const isClusterSettingsActive = path => _.startsWith(path, 'settings/cluster') || _.startsWith(path, 'settings/ldap');

export const Nav = connect(stateToProps, actions)(
class Nav_ extends SafetyFirst {
  componentDidMount() {
    super.componentDidMount();
    this._getClusters();
  }

  _getClusters() {
    const { MULTI_CLUSTER } = this.props.flags;
    const token = MULTI_CLUSTER.get('token');
    const fedApiUrl = MULTI_CLUSTER.get('fedApiUrl');
    coFetchJSON(`/api/federation/clusters?token=${token}&url=${fedApiUrl}`)
      .then((clusters) => {
        this.setState({ clusters: clusters.items });
      })
      .catch(() => this.setState({ clusters: null }));
  }

  render () {
    const {activeNavSectionId, openSection, pathname, flags} =  this.props;
    const accordionProps = id => ({
      id,
      isOpen: id === activeNavSectionId,
      onClick_: () => openSection(id),
    });

    const {clusters} = this.state || {};

    return <div id="sidebar" className="co-img-bg-cells">
      <div className="navigation-container" key={pathname}>
        <div className="navigation-container__section navigation-container__section--logo">
          <Link to="/"><img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo" /></Link>
          {flags.MULTI_CLUSTER && clusters && <ClusterPicker  clusters={clusters} />}
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

        {flags.ETCD_OPERATOR && <NavSection text="Operators" img="static/imgs/operator-logo.svg" {...accordionProps('operators')}>
          <NavLink resource="clusters" name="etcd Clusters" sectionId="operators" />
        </NavSection>}

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
          <NavLink href="settings/cluster" name="Cluster Settings" sectionId="admin" isActive={isClusterSettingsActive} />
          <NavLink resource="serviceaccounts" name="Service Accounts" sectionId="admin" />
          <NavLink resource="roles" name="Roles" required="RBAC" sectionId="admin" isActive={isRolesActive} />
          <NavLink resource="rolebindings" name="Role Bindings" required="RBAC" sectionId="admin" />
        </NavSection>

        {authSvc.userID() && <NavSection text={authSvc.name()} icon="fa-user" {...accordionProps('account')}>
          <NavLink href="settings/profile" name="My Account" sectionId="account" />
          <NavLink href="#" name="Log Out" required="AUTH_ENABLED" onClick={logout} />
        </NavSection>}
      </div>
    </div>;
  }
});
