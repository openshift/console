import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';

import { FLAGS, featureReducerName } from '../features';
import { formatNamespacedRouteForResource } from '../ui/ui-actions';
import { BuildConfigModel, BuildModel, ClusterServiceVersionModel, DeploymentConfigModel, ImageStreamModel, SubscriptionModel, InstallPlanModel, CatalogSourceModel } from '../models';

import { ClusterPicker } from './cluster-picker';

import * as routingImg from '../imgs/routing.svg';
import * as appsLogoImg from '../imgs/apps-logo.svg';
import * as routingActiveImg from '../imgs/routing-active.svg';
import * as appsLogoActiveImg from '../imgs/apps-logo-active.svg';
import { history } from './utils';


const stripNS = href => href.replace(/^\/?k8s\//, '').replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '').replace(/^\//, '');

class NavLink extends React.PureComponent {
  static isActive (props, resourcePath, activeNamespace) {
    let { href } = props;
    const { startsWith, resource } = props;

    if (startsWith) {
      return _.some(startsWith, s => _.startsWith(resourcePath, s));
    }

    href = resource
      ? formatNamespacedRouteForResource(resource, activeNamespace)
      : href;

    const noNSHref = stripNS(href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  render () {
    const { isActive, href, id, name, resource, activeNamespace, target=undefined } = this.props;
    const className = classNames('co-m-nav-link', {active: isActive});

    const to = resource
      ? formatNamespacedRouteForResource(resource, activeNamespace)
      : href;

    return <li className={className}>
      <Link id={id} to={to} target={target}>{name}</Link>
    </li>;
  }
}

NavLink.propTypes = {
  startsWith: PropTypes.arrayOf(PropTypes.string),
  href: PropTypes.string,
  resource: PropTypes.string,
  to: PropTypes.string,
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
        return location.includes('/overview/');
      }
      const resourcePath = location ? stripNS(location) : '';
      return children.filter(c => c.type.isActive && c.type.isActive(c.props, resourcePath, activeNamespace)).map(c => c.props.name)[0];
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
      const href = this.props.href || null;

      if (this.props.href) {
        e && e.stopPropagation();
        history.push(href);
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
            : <Link className="navigation-container__section__title__link" to="/" onClick={this.open}>{text}</Link>
          }
        </div>
        {Children && <ul className="navigation-container__list" style={{maxHeight}}>{Children}</ul>}
      </div>;
    }
  });


const Sep = () => <div className="navigation-container__section__separator" />;

// NavLinks are PureComponents...
const searchStartsWith = ['search'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const imagestreamsStartsWith = ['imagestreams', 'imagestreamtags'];
const clusterSettingsStartsWith = ['settings/cluster', 'settings/ldap'];

export const Nav = () =>
  <div id="sidebar">
    <div className="navigation-container__section navigation-container__section--cluster-picker">
      <ClusterPicker />
    </div>
    <div className="navigation-container">
      <NavSection text="Overview" icon="fa-tachometer" href="/" />
      <NavSection required={FLAGS.CLOUD_SERVICES} text="Applications" img={appsLogoImg} activeImg={appsLogoActiveImg} >
        <NavLink resource={ClusterServiceVersionModel.plural} name="Cluster Service Versions" />
        <Sep />
        <NavLink required={FLAGS.CLOUD_CATALOGS} resource={CatalogSourceModel.plural} name="Open Cloud Catalog" />
        <NavLink resource={SubscriptionModel.plural} name="Subscriptions" />
        <NavLink resource={InstallPlanModel.plural} name="Install Plans" />
      </NavSection>

      <NavSection text="Workloads" icon="fa-folder-open-o" >
        <NavLink resource="daemonsets" name="Daemon Sets" />
        <NavLink resource="deployments" name="Deployments" />
        <NavLink resource="deploymentconfigs" name={DeploymentConfigModel.labelPlural} required={FLAGS.OPENSHIFT} />
        <NavLink resource="replicasets" name="Replica Sets" />
        <NavLink resource="replicationcontrollers" name="Replication Controllers" />
        <NavLink resource="persistentvolumeclaims" name="Persistent Volume Claims" />
        <NavLink resource="statefulsets" name="Stateful Sets" />
        <Sep />
        <NavLink resource="jobs" name="Jobs" />
        <NavLink resource="cronjobs" name="Cron Jobs" />
        <NavLink resource="pods" name="Pods" />
        <NavLink resource="buildconfigs" name={BuildConfigModel.labelPlural} required={FLAGS.OPENSHIFT} />
        <NavLink resource="builds" name={BuildModel.labelPlural} required={FLAGS.OPENSHIFT} />
        <NavLink resource="imagestreams" name={ImageStreamModel.labelPlural} required={FLAGS.OPENSHIFT} startsWith={imagestreamsStartsWith} />
        <NavLink resource="configmaps" name="Config Maps" />
        <NavLink resource="secrets" name="Secrets" />
        <NavLink resource="resourcequotas" name="Resource Quotas" />
      </NavSection>

      <NavSection text="Networking" img={routingImg} activeImg={routingActiveImg} >
        <NavLink resource="ingresses" name="Ingress" />
        <NavLink resource="routes" name="Routes" required={FLAGS.OPENSHIFT} />
        <NavLink resource="networkpolicies" name="Network Policies" required={FLAGS.CALICO} />
        <NavLink resource="services" name="Services" />
      </NavSection>

      <NavSection text="Troubleshooting" icon="fa-life-ring" >
        <NavLink href="/search" name="Search" startsWith={searchStartsWith} />
        <NavLink resource="events" name="Events" />
        <NavLink href="/prometheus" target="_blank" name="Prometheus" required={FLAGS.PROMETHEUS} />
        <NavLink href="/alertmanager" target="_blank" name="Prometheus Alerts" required={FLAGS.PROMETHEUS} />
      </NavSection>

      <NavSection text="Administration" icon="fa-cog" >
        <NavLink href="/k8s/cluster/namespaces" name="Namespaces" />
        <NavLink href="/k8s/cluster/nodes" name="Nodes" />
        <NavLink href="/k8s/cluster/persistentvolumes" name="Persistent Volumes" />
        <NavLink href="/settings/cluster" name="Cluster Settings" startsWith={clusterSettingsStartsWith} />
        <NavLink resource="serviceaccounts" name="Service Accounts" />
        <NavLink href="/k8s/cluster/storageclasses" name="Storage Classes" />
        <NavLink resource="roles" name="Roles" startsWith={rolesStartsWith} />
        <NavLink resource="rolebindings" name="Role Bindings" startsWith={rolebindingsStartsWith} />
        <NavLink resource="podvulns" name="Security Report" required={FLAGS.SECURITY_LABELLER} />
        <NavLink resource="Report:chargeback.coreos.com:v1alpha1" name="Chargeback" />
        <NavLink href="/k8s/cluster/customresourcedefinitions" name="CRDs" />
      </NavSection>
    </div>
  </div>;
