import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';

import { FLAGS, connectToFlags, featureReducerName, flagPending } from '../features';
import { formatNamespacedRouteForResource } from '../ui/ui-actions';
import { BuildConfigModel, BuildModel, ClusterServiceVersionModel, DeploymentConfigModel, ImageStreamModel, SubscriptionModel, InstallPlanModel, CatalogSourceModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { authSvc } from '../module/auth';

import { ClusterPicker } from './cluster-picker';

import * as routingImg from '../imgs/routing.svg';
import * as appsLogoImg from '../imgs/apps-logo.svg';
import * as routingActiveImg from '../imgs/routing-active.svg';
import * as appsLogoActiveImg from '../imgs/apps-logo-active.svg';
import { history, stripBasePath } from './utils';

export const matchesPath = (resourcePath, prefix) => resourcePath === prefix || _.startsWith(resourcePath, `${prefix}/`);
export const matchesModel = (resourcePath, model) => model && matchesPath(resourcePath, referenceForModel(model));

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
    return matchesPath(resourcePath, href) || matchesModel(resourcePath, props.model);
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
  model: PropTypes.object,
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

      const { id, icon, img, text, children, activeNamespace, flags, href = null, activeImg, klass } = this.props;
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

      return <div className={classNames(sectionClassName, klass)}>
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

const ClusterPickerNavSection = connectToFlags(FLAGS.OPENSHIFT)(({flags}) => {
  // Hide the cluster picker on OpenShift clusters. Make sure flag detection is
  // complete before showing the picker.
  const openshiftFlag = flags[FLAGS.OPENSHIFT];
  if (flagPending(openshiftFlag) || openshiftFlag) {
    return null;
  }

  return <div className="navigation-container__section navigation-container__section--cluster-picker">
    <ClusterPicker />
  </div>;
});

const logout = e => {
  e && e.preventDefault();
  authSvc.logout();
};

const UserNavSectionWrapper = connectToFlags(FLAGS.AUTH_ENABLED, FLAGS.OPENSHIFT)(({flags, closeMenu}) => {
  if (!flags[FLAGS.AUTH_ENABLED] || flagPending(flags[FLAGS.OPENSHIFT])) {
    return null;
  }

  if (flags[FLAGS.OPENSHIFT]) {
    return <NavSection text="Logout" icon="fa-user" klass="visible-xs-block" onClick={logout} />;
  }

  return <NavSection text="User" icon="fa-user" klass="visible-xs-block">
    <HrefLink href="/settings/profile" name="My Account" onClick={closeMenu} key="myAccount" />
    <HrefLink href="#" name="Logout" onClick={logout} key="logout" />
  </NavSection>;
});

// HrefLinks are PureComponents...
const searchStartsWith = ['search'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const imagestreamsStartsWith = ['imagestreams', 'imagestreamtags'];
const clusterSettingsStartsWith = ['settings/cluster', 'settings/ldap'];

export class Nav extends React.Component {
  constructor (props) {
    super(props);
    this.scroller = React.createRef();
    this.preventScroll = e => this.preventScroll_(e);
    this.close = () => this.close_();
    this.toggle = () => this.toggle_();

    this.state = {
      isOpen: false,
    };
  }

  // Edge disobeys the spec and doesn't fire off wheel events: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7134034/
  // TODO maybe bind to touch events or something? (onpointermove)
  preventScroll_ (e) {
    const elem = this.scroller.current;

    const scrollTop = elem.scrollTop; // scroll position
    const scrollHeight = elem.scrollHeight; // height of entire area
    const height = elem.offsetHeight; // height of visible area
    const delta = e.deltaY; // how far we scrolled up/down

    const atBottom = delta > 0 && delta + scrollTop + height >= scrollHeight;
    const atTop = delta < 0 && scrollTop + delta <= 0;
    if (atTop || atBottom) {
      // Prevent scroll on body
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
  }

  close_ () {
    this.setState({isOpen: false});
  }

  toggle_ () {
    const { isOpen } = this.state;
    this.setState({isOpen: !isOpen});
  }

  render () {
    const { isOpen } = this.state;


    return <React.Fragment>
      <button type="button" className="sidebar-toggle" aria-controls="sidebar" aria-expanded={isOpen} onClick={this.toggle}>
        <span className="sr-only">Toggle navigation</span>
        <span className="icon-bar" aria-hidden="true"></span>
        <span className="icon-bar" aria-hidden="true"></span>
        <span className="icon-bar" aria-hidden="true"></span>
      </button>
      <div id="sidebar" className={classNames({'open': isOpen})}>
        <ClusterPickerNavSection />
        <div ref={this.scroller} onWheel={this.preventScroll} className="navigation-container">
          <NavSection text="Overview" icon="fa-tachometer" href="/overview" activePath="/overview/" onClick={this.close} />
          <NavSection required={FLAGS.CLOUD_SERVICES} text="Applications" img={appsLogoImg} activeImg={appsLogoActiveImg} >
            <ResourceNSLink model={ClusterServiceVersionModel} resource={ClusterServiceVersionModel.plural} name="Cluster Service Versions" onClick={this.close} />
            <Sep />
            <ResourceNSLink model={CatalogSourceModel} resource={CatalogSourceModel.plural} name="Open Cloud Catalog" onClick={this.close} />
            <ResourceNSLink model={SubscriptionModel} resource={SubscriptionModel.plural} name="Subscriptions" onClick={this.close} />
            <ResourceNSLink model={InstallPlanModel} resource={InstallPlanModel.plural} name="Install Plans" onClick={this.close} />
          </NavSection>

          <NavSection text="Workloads" icon="fa-folder-open-o">
            <ResourceNSLink resource="daemonsets" name="Daemon Sets" onClick={this.close} />
            <ResourceNSLink resource="deployments" name="Deployments" onClick={this.close} />
            <ResourceNSLink resource="deploymentconfigs" name={DeploymentConfigModel.labelPlural} onClick={this.close} required={FLAGS.OPENSHIFT} />
            <ResourceNSLink resource="replicasets" name="Replica Sets" onClick={this.close} />
            <ResourceNSLink resource="replicationcontrollers" name="Replication Controllers" onClick={this.close} />
            <ResourceNSLink resource="persistentvolumeclaims" name="Persistent Volume Claims" onClick={this.close} />
            <ResourceNSLink resource="statefulsets" name="Stateful Sets" onClick={this.close} />
            <Sep />
            <ResourceNSLink resource="jobs" name="Jobs" onClick={this.close} />
            <ResourceNSLink resource="cronjobs" name="Cron Jobs" onClick={this.close} />
            <ResourceNSLink resource="pods" name="Pods" onClick={this.close} />
            <ResourceNSLink resource="buildconfigs" name={BuildConfigModel.labelPlural} onClick={this.close} required={FLAGS.OPENSHIFT} />
            <ResourceNSLink resource="builds" name={BuildModel.labelPlural} onClick={this.close} required={FLAGS.OPENSHIFT} />
            <ResourceNSLink resource="imagestreams" name={ImageStreamModel.labelPlural} onClick={this.close} required={FLAGS.OPENSHIFT} startsWith={imagestreamsStartsWith} />
            <ResourceNSLink resource="configmaps" name="Config Maps" onClick={this.close} />
            <ResourceNSLink resource="secrets" name="Secrets" onClick={this.close} />
            <ResourceNSLink resource="resourcequotas" name="Resource Quotas" onClick={this.close} />
            <ResourceNSLink resource="horizontalpodautoscalers" name="HPAs" onClick={this.close} />
          </NavSection>

          <NavSection text="Networking" img={routingImg} activeImg={routingActiveImg} >
            <ResourceNSLink resource="ingresses" name="Ingress" onClick={this.close} />
            <ResourceNSLink resource="routes" name="Routes" onClick={this.close} required={FLAGS.OPENSHIFT} />
            <ResourceNSLink resource="networkpolicies" name="Network Policies" onClick={this.close} required={FLAGS.CALICO} />
            <ResourceNSLink resource="services" name="Services" onClick={this.close} />
          </NavSection>

          <NavSection text="Troubleshooting" icon="fa-life-ring">
            <HrefLink href="/search" name="Search" onClick={this.close} startsWith={searchStartsWith} />
            <ResourceNSLink resource="events" name="Events" onClick={this.close} />
            { /* FIXME: These links are wrong for OpenShift. */ }
            <HrefLink href="/prometheus" target="_blank" name="Prometheus" onClick={this.close} required={FLAGS.PROMETHEUS} />
            <HrefLink href="/alertmanager" target="_blank" name="Prometheus Alerts" onClick={this.close} required={FLAGS.PROMETHEUS} />
          </NavSection>

          <NavSection text="Administration" icon="fa-cog">
            <ResourceClusterLink resource="projects" name="Projects" onClick={this.close} required={FLAGS.OPENSHIFT} />
            <ResourceClusterLink resource="namespaces" name="Namespaces" onClick={this.close} required={FLAGS.CAN_LIST_NS} />
            <ResourceClusterLink resource="nodes" name="Nodes" onClick={this.close} required={FLAGS.CAN_LIST_NODE} />
            <ResourceClusterLink resource="persistentvolumes" name="Persistent Volumes" onClick={this.close} required={FLAGS.CAN_LIST_PV} />
            <HrefLink href="/settings/cluster" name="Cluster Settings" onClick={this.close} startsWith={clusterSettingsStartsWith} />
            <ResourceNSLink resource="serviceaccounts" name="Service Accounts" onClick={this.close} />
            <ResourceClusterLink resource="storageclasses" name="Storage Classes" onClick={this.close} required={FLAGS.CAN_LIST_STORE} />
            <ResourceNSLink resource="roles" name="Roles" startsWith={rolesStartsWith} onClick={this.close} />
            <ResourceNSLink resource="rolebindings" name="Role Bindings" onClick={this.close} startsWith={rolebindingsStartsWith} />
            <ResourceNSLink resource="podvulns" name="Security Report" onClick={this.close} required={FLAGS.SECURITY_LABELLER} />
            <ResourceNSLink resource="chargeback.coreos.com:v1alpha1:Report" name="Chargeback" onClick={this.close} />
            <ResourceClusterLink resource="customresourcedefinitions" name="CRDs" onClick={this.close} required={FLAGS.CAN_LIST_CRD} />
          </NavSection>

          <UserNavSectionWrapper closeMenu={this.close} />
        </div>
      </div>
    </React.Fragment>;
  }
}
