import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';

import { FLAGS, featureReducerName, flagPending } from '../features';
import { monitoringReducerName, MonitoringRoutes } from '../monitoring';
import { formatNamespacedRouteForResource } from '../ui/ui-actions';
import {
  BuildConfigModel,
  BuildModel,
  CatalogSourceModel,
  ChargebackReportModel,
  ClusterServiceVersionModel,
  DeploymentConfigModel,
  ImageStreamModel,
  InstallPlanModel,
  MachineConfigModel,
  MachineConfigPoolModel,
  MachineModel,
  MachineSetModel,
  PackageManifestModel,
  SubscriptionModel,
} from '../models';
import { referenceForModel } from '../module/k8s';

import { stripBasePath } from './utils';

export const matchesPath = (resourcePath, prefix) => resourcePath === prefix || _.startsWith(resourcePath, `${prefix}/`);
export const matchesModel = (resourcePath, model) => model && matchesPath(resourcePath, referenceForModel(model));

import { Nav, NavExpandable, NavItem, NavList, PageSidebar } from '@patternfly/react-core';

const stripNS = href => {
  href = stripBasePath(href);
  return href.replace(/^\/?k8s\//, '').replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '').replace(/^\//, '');
};

const ExternalLink = ({href, name}) => <NavItem isActive={false}>
  <a className="pf-c-nav__link" href={href} target="_blank">{name}<span className="co-external-link"></span></a>
</NavItem>;

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
    const { isActive, isSeparated, separatorConditions, flags, id, name, onClick } = this.props;
    let showSeparator = isSeparated;
    const separatorConditionsArray = separatorConditions ? _.castArray(separatorConditions) : [];
    _.forEach(separatorConditionsArray, required => {
      const requiredArray = required ? _.castArray(required) : [];
      const notAllowed = _.some(requiredArray, flag => (
        flag && (flagPending(flags.get(flag)) || !flags.get(flag))
      ));
      showSeparator = showSeparator || !notAllowed;
    });

    // onClick is now handled globally by the Nav's onSelect,
    // however onClick can still be passed if desired in certain cases

    return (
      <NavItem isActive={isActive} isSeparated={showSeparator}>
        <Link
          id={id}
          to={this.to}
          onClick={onClick}
        >
          {name}
        </Link>
      </NavItem>
    );
  }
}

NavLink.defaultProps = {
  required: '',
  disallowed: '',
};

NavLink.propTypes = {
  required: PropTypes.string,
  disallowed: PropTypes.string,
};

class ResourceNSLink extends NavLink {
  static isActive(props, resourcePath, activeNamespace) {
    const href = stripNS(formatNamespacedRouteForResource(props.resource, activeNamespace));
    return matchesPath(resourcePath, href) || matchesModel(resourcePath, props.model);
  }

  get to() {
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
  static isActive(props, resourcePath) {
    return resourcePath === props.resource || _.startsWith(resourcePath, `${props.resource}/`) || matchesModel(resourcePath, props.model);
  }

  get to() {
    return `/k8s/cluster/${this.props.resource}`;
  }
}

ResourceClusterLink.propTypes = {
  name: PropTypes.string.isRequired,
  startsWith: PropTypes.arrayOf(PropTypes.string),
  resource: PropTypes.string.isRequired,
  model: PropTypes.object,
};

class HrefLink extends NavLink {
  static isActive(props, resourcePath) {
    const noNSHref = stripNS(props.href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  get to() {
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
    constructor(props) {
      super(props);
      this.toggle = (e, val) => this.toggle_(e, val);
      this.state = { isOpen: false, activeChild: null };

      const activeChild = this.getActiveChild();
      if (activeChild) {
        this.state.activeChild = activeChild;
        this.state.isOpen = true;
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      const { isOpen } = this.state;

      if (isOpen !== nextProps.isOpen) {
        return true;
      }

      if (!isOpen && !nextState.isOpen) {
        return false;
      }

      return nextProps.location !== this.props.location || nextProps.flags !== this.props.flags;
    }

    getActiveChild() {
      const { activeNamespace, location, children } = this.props;

      if (!children) {
        return stripBasePath(location).startsWith(this.props.activePath);
      }

      const resourcePath = location ? stripNS(location) : '';

      //current bug? - we should be checking if children is a single item or .filter is undefined
      return children.filter(c => {
        if (!c) {
          return false;
        }
        if (c.props.startsWith) {
          const active = c.type.startsWith(resourcePath, c.props.startsWith, activeNamespace);
          if (active || !c.props.activePath) {
            return active;
          }
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

    toggle_(e, expandState) {
      this.setState({isOpen: expandState});
    }

    render() {
      if (!this.props.canRender) {
        return null;
      }

      const { title, children, activeNamespace, flags } = this.props;
      const { isOpen, activeChild } = this.state;
      const isActive = !!activeChild;

      const Children = React.Children.map(children, c => {
        if (!c) {
          return null;
        }
        const {name, required, disallowed} = c.props;
        const requiredArray = required ? _.castArray(required) : [];
        const requirementMissing = _.some(requiredArray, flag => (
          flag && (flagPending(flags.get(flag)) || !flags.get(flag))
        ));
        if (requirementMissing) {
          return null;
        }
        if (disallowed && (flagPending(flags.get(disallowed)) || flags.get(disallowed))) {
          return null;
        }
        return React.cloneElement(c, {key: name, isActive: name === this.state.activeChild, activeNamespace, flags});
      });

      return Children ? (
        <NavExpandable title={title} isActive={isActive} isExpanded={isOpen} onExpand={this.toggle}>
          {Children}
        </NavExpandable>
      ) : null;
    }
  }
);

const searchStartsWith = ['search'];
const operatorManagementStartsWith = [
  referenceForModel(PackageManifestModel),
  PackageManifestModel.path,
  // FIXME(alecmerdler): Needed for backwards-compatibility with new API groups
  'packages.apps.redhat.com~v1alpha1~PackageManifest',
  referenceForModel(SubscriptionModel),
  SubscriptionModel.path,
  referenceForModel(InstallPlanModel),
  InstallPlanModel.path,
  referenceForModel(CatalogSourceModel),
  CatalogSourceModel.path,
];
const provisionedServicesStartsWith = ['serviceinstances', 'servicebindings'];
const brokerManagementStartsWith = ['clusterservicebrokers', 'clusterserviceclasses'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const quotaStartsWith = ['resourcequotas', 'clusterresourcequotas'];
const imagestreamsStartsWith = ['imagestreams', 'imagestreamtags'];
const monitoringAlertsStartsWith = ['monitoring/alerts', 'monitoring/alertrules'];
const clusterSettingsStartsWith = ['settings/cluster', 'settings/idp', 'config.openshift.io'];

const monitoringNavSectionStateToProps = (state) => ({
  canAccess: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
  grafanaURL: state[monitoringReducerName].get(MonitoringRoutes.Grafana),
  kibanaURL: state[monitoringReducerName].get(MonitoringRoutes.Kibana),
  prometheusURL: state[monitoringReducerName].get(MonitoringRoutes.Prometheus),
});

const MonitoringNavSection_ = ({grafanaURL, canAccess, kibanaURL, prometheusURL}) => {
  const showAlerts = canAccess && !!window.SERVER_FLAGS.prometheusBaseURL;
  const showSilences = canAccess && !!window.SERVER_FLAGS.alertManagerBaseURL;
  const showPrometheus = canAccess && !!prometheusURL;
  const showGrafana = canAccess && !!grafanaURL;
  return showAlerts || showSilences || showPrometheus || showGrafana || kibanaURL
    ? <NavSection title="Monitoring">
      {showAlerts && <HrefLink href="/monitoring/alerts" name="Alerts" startsWith={monitoringAlertsStartsWith} />}
      {showSilences && <HrefLink href="/monitoring/silences" name="Silences" />}
      {showPrometheus && <ExternalLink href={prometheusURL} name="Metrics" />}
      {showGrafana && <ExternalLink href={grafanaURL} name="Dashboards" />}
      {kibanaURL && <ExternalLink href={kibanaURL} name="Logging" />}
    </NavSection>
    : null;
};
const MonitoringNavSection = connect(monitoringNavSectionStateToProps)(MonitoringNavSection_);

export const Navigation = ({ isNavOpen, onNavSelect }) => {
  const PageNav = (
    <Nav aria-label="Nav" onSelect={onNavSelect}>
      <NavList>
        <NavSection title="Home">
          <ResourceClusterLink resource="projects" name="Projects" required={FLAGS.OPENSHIFT} />
          {
            // Show different status pages based on OpenShift vs native Kubernetes.
            // TODO: Make Overview work on native Kubernetes. It currently assumes OpenShift resources.
          }
          <HrefLink href="/overview" name="Status" activePath="/overview/" required={FLAGS.OPENSHIFT} />
          <HrefLink href="/status" name="Status" activePath="/status/" disallowed={FLAGS.OPENSHIFT} />
          <HrefLink href="/search" name="Search" startsWith={searchStartsWith} />
          <ResourceNSLink resource="events" name="Events" />
        </NavSection>

        <NavSection title="Catalog">
          <HrefLink href="/catalog" name="Developer Catalog" activePath="/catalog/" />
          <HrefLink
            href="/provisionedservices"
            name="Provisioned Services"
            activePath="/provisionedservices/"
            startsWith={provisionedServicesStartsWith}
            required={FLAGS.SERVICE_CATALOG}
          />
          <ResourceNSLink
            model={ClusterServiceVersionModel}
            resource={ClusterServiceVersionModel.plural}
            name="Installed Operators"
            separatorConditions={[
              [FLAGS.CAN_LIST_PACKAGE_MANIFEST, FLAGS.CAN_LIST_OPERATOR_GROUP, FLAGS.OPERATOR_HUB],
              [FLAGS.CAN_LIST_PACKAGE_MANIFEST, FLAGS.CAN_LIST_OPERATOR_GROUP],
              FLAGS.SERVICE_CATALOG,
            ]}
          />
          <HrefLink
            required={[FLAGS.CAN_LIST_PACKAGE_MANIFEST, FLAGS.CAN_LIST_OPERATOR_GROUP, FLAGS.OPERATOR_HUB]}
            href="/operatorhub"
            name="OperatorHub"
            activePath="/operatorhub/"
          />
          <HrefLink
            href="/operatormanagement"
            name="Operator Management"
            activePath="/operatormanagement/"
            startsWith={operatorManagementStartsWith}
          />
          <HrefLink
            href="/brokermanagement"
            name="Broker Management"
            activePath="/brokermanagement/"
            startsWith={brokerManagementStartsWith}
            required={FLAGS.SERVICE_CATALOG}
          />
        </NavSection>

        <NavSection title="Workloads">
          <ResourceNSLink resource="pods" name="Pods" />
          <ResourceNSLink resource="deployments" name="Deployments" />
          <ResourceNSLink resource="deploymentconfigs" name={DeploymentConfigModel.labelPlural} required={FLAGS.OPENSHIFT} />
          <ResourceNSLink resource="statefulsets" name="Stateful Sets" />
          <ResourceNSLink resource="secrets" name="Secrets" />
          <ResourceNSLink resource="configmaps" name="Config Maps" isSeparated />
          <ResourceNSLink resource="cronjobs" name="Cron Jobs" />
          <ResourceNSLink resource="jobs" name="Jobs" />
          <ResourceNSLink resource="daemonsets" name="Daemon Sets" />
          <ResourceNSLink resource="replicasets" name="Replica Sets" />
          <ResourceNSLink resource="replicationcontrollers" name="Replication Controllers" />
          <ResourceNSLink resource="horizontalpodautoscalers" name="Horizontal Pod Autoscalers" />
        </NavSection>

        <NavSection title="Networking">
          <ResourceNSLink resource="services" name="Services" />
          <ResourceNSLink resource="routes" name="Routes" required={FLAGS.OPENSHIFT} />
          <ResourceNSLink resource="ingresses" name="Ingress" />
          <ResourceNSLink resource="networkpolicies" name="Network Policies" />
        </NavSection>

        <NavSection title="Storage">
          <ResourceClusterLink resource="persistentvolumes" name="Persistent Volumes" required={FLAGS.CAN_LIST_PV} />
          <ResourceNSLink resource="persistentvolumeclaims" name="Persistent Volume Claims" />
          <ResourceClusterLink resource="storageclasses" name="Storage Classes" />
        </NavSection>

        <NavSection title="Builds" required={FLAGS.OPENSHIFT}>
          <ResourceNSLink resource="buildconfigs" name={BuildConfigModel.labelPlural} />
          <ResourceNSLink resource="builds" name={BuildModel.labelPlural} />
          <ResourceNSLink resource="imagestreams" name={ImageStreamModel.labelPlural} startsWith={imagestreamsStartsWith} />
        </NavSection>

        <MonitoringNavSection />

        <NavSection title="Compute" required={FLAGS.CAN_LIST_NODE}>
          <ResourceClusterLink resource="nodes" name="Nodes" />
          <ResourceNSLink resource={referenceForModel(MachineModel)} name="Machines" required={FLAGS.CLUSTER_API} />
          <ResourceNSLink resource={referenceForModel(MachineSetModel)} name="Machine Sets" required={FLAGS.CLUSTER_API} isSeparated />
          <ResourceClusterLink resource={referenceForModel(MachineConfigModel)} name="Machine Configs" required={FLAGS.MACHINE_CONFIG} />
          <ResourceClusterLink resource={referenceForModel(MachineConfigPoolModel)} name="Machine Config Pools" required={FLAGS.MACHINE_CONFIG} />
        </NavSection>

        <NavSection title="Administration">
          <HrefLink href="/cluster-status" name="Cluster Status" activePath="/cluster-status/" required={FLAGS.CAN_LIST_NS} />
          <HrefLink href="/settings/cluster" activePath="/settings/cluster/" name="Cluster Settings" required={FLAGS.CLUSTER_VERSION} startsWith={clusterSettingsStartsWith} />
          <ResourceClusterLink resource="namespaces" name="Namespaces" required={FLAGS.CAN_LIST_NS} />
          <ResourceNSLink resource="serviceaccounts" name="Service Accounts" />
          <ResourceNSLink resource="roles" name="Roles" startsWith={rolesStartsWith} />
          <ResourceNSLink resource="rolebindings" name="Role Bindings" startsWith={rolebindingsStartsWith} />
          <ResourceNSLink resource="resourcequotas" name="Resource Quotas" startsWith={quotaStartsWith} />
          <ResourceNSLink resource="limitranges" name="Limit Ranges" />
          <ResourceNSLink resource={referenceForModel(ChargebackReportModel)} name="Chargeback" disallowed={FLAGS.OPENSHIFT} />
          <ResourceClusterLink resource="customresourcedefinitions" name="Custom Resource Definitions" required={FLAGS.CAN_LIST_CRD} />
        </NavSection>
      </NavList>
    </Nav>
  );
  return <PageSidebar nav={PageNav} isNavOpen={isNavOpen} />;
};

Navigation.propTypes = {
  isNavOpen: PropTypes.bool,
  onNavSelect: PropTypes.func,
};
