import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';

import { FLAGS, featureReducerName } from '../features';
import { formatNamespacedRouteForResource, UIActions } from '../ui/ui-actions';
import { BuildConfigModel, BuildModel, ClusterServiceVersionModel, DeploymentConfigModel, ImageStreamModel, SubscriptionModel, InstallPlanModel, CatalogSourceModel } from '../models';

import { ClusterPicker } from './cluster-picker';

import * as routingImg from '../imgs/routing.svg';
import * as appsLogoImg from '../imgs/apps-logo.svg';
import * as routingActiveImg from '../imgs/routing-active.svg';
import * as appsLogoActiveImg from '../imgs/apps-logo-active.svg';
import { history, stripBasePath } from './utils';


const stripNS = href => {
  href = stripBasePath(href);
  return href.replace(/^\/?k8s\//, '').replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '').replace(/^\//, '');
};

class NavLink extends React.PureComponent {
  static isActive() {
    throw new Error('not implemented');
  }

  get to() {
    throw new Error('not implemented');
  }

  static startsWith(resourcePath, someStrings) {
    return _.some(someStrings, s => resourcePath.startsWith(s));
  }

  render() {
    const { isActive, id, name, target, onClick } = this.props;

    return <li className={classNames('co-m-nav-link', { active: isActive })}>
      <Link id={id} to={this.to} target={target} onClick={onClick}>{name}</Link>
    </li>;
  }
}

class ResourceNSLink extends NavLink {
  static isActive (props, resourcePath, activeNamespace) {
    const href = stripNS(formatNamespacedRouteForResource(props.resource, activeNamespace));
    return resourcePath === href || _.startsWith(resourcePath, `${href}/`);
  }

  get to () {
    const { resource, activeNamespace } = this.props;
    return formatNamespacedRouteForResource(resource, activeNamespace);
  }
}

ResourceNSLink.propTypes = {
  name: PropTypes.string.isRequired,
  startsWith: PropTypes.arrayOf(PropTypes.string),
  resource: PropTypes.string.isRequired,
  activeNamespace: PropTypes.string,
};

class ResourceClusterLink extends NavLink {
  static isActive (props, resourcePath) {
    return resourcePath === props.resource || _.startsWith(resourcePath, `${props.resource}/`);
  }

  get to () {
    return `/k8s/cluster/${this.props.resource}`;
  }
}

ResourceClusterLink.propTypes = {
  name: PropTypes.string.isRequired,
  startsWith: PropTypes.arrayOf(PropTypes.string),
  resource: PropTypes.string.isRequired,
};

class HrefLink extends NavLink {
  static isActive (props, resourcePath) {
    const noNSHref = stripNS(props.href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  get to () {
    return this.props.href;
  }
}

HrefLink.propTypes = {
  name: PropTypes.string.isRequired,
  startsWith: PropTypes.arrayOf(PropTypes.string),
  href: PropTypes.string.isRequired,
};

const navSectionStateToProps = (state, {required}) => {
  const flags = state[featureReducerName];
  const canRender = required ? flags.get(required) : true;

  return {
    flags, canRender,
    activeNamespace: state.UI.get('activeNamespace'),
    location: state.UI.get('location'),
  };
};

const NavSection = connect(navSectionStateToProps)(
  class NavSection extends React.Component {
    constructor (props) {
      super(props);
      this.toggle = e => this.toggle_(e);
      this.open = () => this.open_();
      this.state = { isOpen: false, activeChild: null };

      const activeChild = this.getActiveChild();
      if (activeChild) {
        this.state.activeChild = activeChild;
        this.state.isOpen = true;
      }
    }

    shouldComponentUpdate (nextProps, nextState) {
      const { isOpen } = this.state;

      if (isOpen !== nextProps.isOpen) {
        return true;
      }

      if (!isOpen && !nextState.isOpen) {
        return false;
      }

      return nextProps.location !== this.props.location || nextProps.flags !== this.props.flags;
    }

    getActiveChild () {
      const { activeNamespace, location, children } = this.props;

      if (!children) {
        return stripBasePath(location).startsWith(this.props.activePath);
      }

      const resourcePath = location ? stripNS(location) : '';

      return children.filter(c => {
        if (c.props.startsWith) {
          return c.type.startsWith(resourcePath, c.props.startsWith);
        }
        return c.type.isActive && c.type.isActive(c.props, resourcePath, activeNamespace);
      }).map(c => c.props.name)[0];
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevProps.location === this.props.location) {
        return;
      }

      const activeChild = this.getActiveChild();
      const state = {activeChild};
      if (activeChild && !prevState.activeChild) {
        state.isOpen = true;
      }
      this.setState(state);
    }

    open_ () {
      this.setState({isOpen: true});
    }

    toggle_(e) {
      const { href, onClick } = this.props;

      if (href) {
        e && e.stopPropagation();
        history.push(href);
      }

      if (onClick) {
        onClick();
      }

      this.setState({isOpen: !this.state.isOpen});
    }

    render () {
      if (!this.props.canRender) {
        return null;
      }

      const { id, icon, img, text, children, activeNamespace, flags, href = null, activeImg } = this.props;
      const isActive = !!this.state.activeChild;
      // WARNING:
      // we transition on max-height because you can't transition to height 'inherit'
      // however, the transition animiation is calculated on the actual max-height, so it must be roughly equal to the actual height
      // we could use scaleY, but that literally scales along the Y axis, ie shrinks
      // we could use flexbox or the equivalent to get an actual height, but this is the easiest solution :-/

      const maxHeight = !this.state.isOpen ? 0 : 29 * _.get(this.props.children, 'length', 1);

      const iconClassName = icon && `fa ${icon} navigation-container__section__title__icon ${isActive ? 'navigation-container__section__title__icon--active' : ''}`;
      const sectionClassName = isActive && href ? 'navigation-container__section navigation-container__section--active' : 'navigation-container__section';

      const Children = React.Children.map(children, c => {
        const {name, required} = c.props;
        if (required && !flags.get(required)) {
          return null;
        }
        return React.cloneElement(c, {key: name, isActive: name === this.state.activeChild, activeNamespace});
      });

      return <div className={sectionClassName}>
        <div id={id} className="navigation-container__section__title" onClick={this.toggle}>
          {icon && <i className={iconClassName}></i>}
          {img && <img src={isActive && activeImg ? activeImg : img} />}
          { !href
            ? text
            : <Link className="navigation-container__section__title__link" to={href} onClick={this.open}>{text}</Link>
          }
        </div>
        {Children && <ul className="navigation-container__list" style={{maxHeight}}>{Children}</ul>}
      </div>;
    }
  }
);

const Sep = () => <div className="navigation-container__section__separator" />;

// HrefLinks are PureComponents...
const searchStartsWith = ['search'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const imagestreamsStartsWith = ['imagestreams', 'imagestreamtags'];
const clusterSettingsStartsWith = ['settings/cluster', 'settings/ldap'];

const navStateToProps = state => ({
  sidebarOpen: state.UI.get('sidebarOpen'),
});

const navDispatchToProps = dispatch => ({
  closeSidebar: () => dispatch(UIActions.setSidebarOpen(false)),
});

export const Nav = connect(navStateToProps, navDispatchToProps)(({sidebarOpen, closeSidebar}) =>
  <div id="sidebar" className={sidebarOpen ? 'open' : ''}>
    <div className="navigation-container__section navigation-container__section--cluster-picker">
      <ClusterPicker />
    </div>
    <div className="navigation-container">
      <NavSection text="Overview" icon="fa-tachometer" href="/" activePath="/overview/" onClick={closeSidebar} />
      <NavSection required={FLAGS.CLOUD_SERVICES} text="Applications" img={appsLogoImg} activeImg={appsLogoActiveImg} >
        <ResourceNSLink resource={ClusterServiceVersionModel.plural} name="Cluster Service Versions" onClick={closeSidebar} />
        <Sep />
        <ResourceNSLink resource={CatalogSourceModel.plural} name="Open Cloud Catalog" onClick={closeSidebar} />
        <ResourceNSLink resource={SubscriptionModel.plural} name="Subscriptions" onClick={closeSidebar} />
        <ResourceNSLink resource={InstallPlanModel.plural} name="Install Plans" onClick={closeSidebar} />
      </NavSection>

      <NavSection text="Workloads" icon="fa-folder-open-o">
        <ResourceNSLink resource="daemonsets" name="Daemon Sets" onClick={closeSidebar} />
        <ResourceNSLink resource="deployments" name="Deployments" onClick={closeSidebar} />
        <ResourceNSLink resource="deploymentconfigs" name={DeploymentConfigModel.labelPlural} onClick={closeSidebar} required={FLAGS.OPENSHIFT} />
        <ResourceNSLink resource="replicasets" name="Replica Sets" onClick={closeSidebar} />
        <ResourceNSLink resource="replicationcontrollers" name="Replication Controllers" onClick={closeSidebar} />
        <ResourceNSLink resource="persistentvolumeclaims" name="Persistent Volume Claims" onClick={closeSidebar} />
        <ResourceNSLink resource="statefulsets" name="Stateful Sets" onClick={closeSidebar} />
        <Sep />
        <ResourceNSLink resource="jobs" name="Jobs" onClick={closeSidebar} />
        <ResourceNSLink resource="cronjobs" name="Cron Jobs" onClick={closeSidebar} />
        <ResourceNSLink resource="pods" name="Pods" onClick={closeSidebar} />
        <ResourceNSLink resource="buildconfigs" name={BuildConfigModel.labelPlural} onClick={closeSidebar} required={FLAGS.OPENSHIFT} />
        <ResourceNSLink resource="builds" name={BuildModel.labelPlural} onClick={closeSidebar} required={FLAGS.OPENSHIFT} />
        <ResourceNSLink resource="imagestreams" name={ImageStreamModel.labelPlural} onClick={closeSidebar} required={FLAGS.OPENSHIFT} startsWith={imagestreamsStartsWith} />
        <ResourceNSLink resource="configmaps" name="Config Maps" onClick={closeSidebar} />
        <ResourceNSLink resource="secrets" name="Secrets" onClick={closeSidebar} />
        <ResourceNSLink resource="resourcequotas" name="Resource Quotas" onClick={closeSidebar} />
      </NavSection>

      <NavSection text="Networking" img={routingImg} activeImg={routingActiveImg} >
        <ResourceNSLink resource="ingresses" name="Ingress" onClick={closeSidebar} />
        <ResourceNSLink resource="routes" name="Routes" onClick={closeSidebar} required={FLAGS.OPENSHIFT} />
        <ResourceNSLink resource="networkpolicies" name="Network Policies" onClick={closeSidebar} required={FLAGS.CALICO} />
        <ResourceNSLink resource="services" name="Services" onClick={closeSidebar} />
      </NavSection>

      <NavSection text="Troubleshooting" icon="fa-life-ring">
        <HrefLink href="/search" name="Search" onClick={closeSidebar} startsWith={searchStartsWith} />
        <ResourceNSLink resource="events" name="Events" onClick={closeSidebar} />
        <HrefLink href="/prometheus" target="_blank" name="Prometheus" onClick={closeSidebar} required={FLAGS.PROMETHEUS} />
        <HrefLink href="/alertmanager" target="_blank" name="Prometheus Alerts" onClick={closeSidebar} required={FLAGS.PROMETHEUS} />
      </NavSection>

      <NavSection text="Administration" icon="fa-cog">
        <ResourceClusterLink resource="projects" name="Projects" onClick={closeSidebar} required={FLAGS.OPENSHIFT} />
        <ResourceClusterLink resource="namespaces" name="Namespaces" onClick={closeSidebar} required={FLAGS.CAN_LIST_NS} />
        <ResourceClusterLink resource="nodes" name="Nodes" onClick={closeSidebar} />
        <ResourceClusterLink resource="persistentvolumes" name="Persistent Volumes" onClick={closeSidebar} />
        <HrefLink href="/settings/cluster" name="Cluster Settings" onClick={closeSidebar} startsWith={clusterSettingsStartsWith} />
        <ResourceNSLink resource="serviceaccounts" name="Service Accounts" onClick={closeSidebar} />
        <ResourceClusterLink resource="storageclasses" name="Storage Classes" onClick={closeSidebar} />
        <ResourceNSLink resource="roles" name="Roles" startsWith={rolesStartsWith} onClick={closeSidebar} />
        <ResourceNSLink resource="rolebindings" name="Role Bindings" onClick={closeSidebar} startsWith={rolebindingsStartsWith} />
        <ResourceNSLink resource="podvulns" name="Security Report" onClick={closeSidebar} required={FLAGS.SECURITY_LABELLER} />
        <ResourceNSLink resource="Report:chargeback.coreos.com:v1alpha1" name="Chargeback" onClick={closeSidebar} />
        <ResourceClusterLink resource="customresourcedefinitions" name="CRDs" onClick={closeSidebar} />
      </NavSection>
    </div>
  </div>);
