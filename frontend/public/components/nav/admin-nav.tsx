import * as React from 'react';
import { connect } from 'react-redux';
import { NavItemSeparator } from '@patternfly/react-core';

import { FLAGS } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import { featureReducerName } from '../../reducers/features';
import { monitoringReducerName, MonitoringRoutes } from '../../reducers/monitoring';

import {
  BuildConfigModel,
  BuildModel,
  ChargebackReportModel,
  DeploymentConfigModel,
  GroupModel,
  ImageStreamModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineConfigPoolModel,
  MachineHealthCheckModel,
  MachineModel,
  MachineSetModel,
  UserModel,
} from '../../models';

import { referenceForModel } from '../../module/k8s';
import { ExternalLink, HrefLink, ResourceNSLink, ResourceClusterLink } from './items';
import { NavSection } from './section';

type SeparatorProps = {
  name: string;
  required?: string;
};

// Wrap `NavItemSeparator` so we can use `required` without prop type errors.
const Separator: React.FC<SeparatorProps> = ({ name }) => <NavItemSeparator name={name} />;

const searchStartsWith = ['search'];
const provisionedServicesStartsWith = ['serviceinstances', 'servicebindings'];
const brokerManagementStartsWith = ['clusterservicebrokers', 'clusterserviceclasses'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const quotaStartsWith = ['resourcequotas', 'clusterresourcequotas'];
const imagestreamsStartsWith = ['imagestreams', 'imagestreamtags'];
const monitoringAlertsStartsWith = [
  'monitoring/alerts',
  'monitoring/alertrules',
  'monitoring/silences',
];
const clusterSettingsStartsWith = [
  'settings/cluster',
  'settings/idp',
  'config.openshift.io',
  'monitoring/alertmanagerconfig',
  'monitoring/alertmanageryaml',
];
const meteringStartsWith = ['metering.openshift.io'];
const apiExplorerStartsWith = ['api-explorer', 'api-resource'];

const monitoringNavSectionStateToProps = (state) => ({
  canAccess: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
  kibanaURL: state[monitoringReducerName].get(MonitoringRoutes.Kibana),
});

const MonitoringNavSection_ = ({ canAccess, kibanaURL }) => {
  const canAccessPrometheus = canAccess && !!window.SERVER_FLAGS.prometheusBaseURL;
  const showSilences = canAccess && !!window.SERVER_FLAGS.alertManagerBaseURL;
  return canAccessPrometheus || showSilences || kibanaURL ? (
    <NavSection title="Monitoring">
      {canAccessPrometheus && (
        <HrefLink
          href="/monitoring/alerts"
          name="Alerting"
          startsWith={monitoringAlertsStartsWith}
        />
      )}
      {canAccessPrometheus && (
        <HrefLink
          href="/monitoring/query-browser?query0="
          name="Metrics"
          startsWith={['monitoring/query-browser']}
        />
      )}
      {canAccessPrometheus && <HrefLink href="/monitoring/dashboards" name="Dashboards" />}
      {kibanaURL && <ExternalLink href={kibanaURL} name="Logging" />}
    </NavSection>
  ) : null;
};
const MonitoringNavSection = connect(monitoringNavSectionStateToProps)(MonitoringNavSection_);

const AdminNav = () => (
  <>
    <NavSection title="Home">
      <HrefLink
        href="/dashboards"
        activePath="/dashboards/"
        name="Overview"
        required={[FLAGS.CAN_GET_NS, FLAGS.OPENSHIFT]}
      />
      <ResourceClusterLink resource="projects" name="Projects" required={FLAGS.OPENSHIFT} />
      <HrefLink href="/search" name="Search" startsWith={searchStartsWith} />
      <HrefLink href="/api-explorer" name="Explore" startsWith={apiExplorerStartsWith} />
      <ResourceNSLink resource="events" name="Events" />
    </NavSection>

    <NavSection title="Operators" />

    <NavSection title="Workloads">
      <ResourceNSLink resource="pods" name="Pods" />
      <ResourceNSLink resource="deployments" name="Deployments" />
      <ResourceNSLink
        resource="deploymentconfigs"
        name={DeploymentConfigModel.labelPlural}
        required={FLAGS.OPENSHIFT}
      />
      <ResourceNSLink resource="statefulsets" name="Stateful Sets" />
      <ResourceNSLink resource="secrets" name="Secrets" />
      <ResourceNSLink resource="configmaps" name="Config Maps" />
      <Separator name="WorkloadsSeparator" />
      <ResourceNSLink resource="cronjobs" name="Cron Jobs" />
      <ResourceNSLink resource="jobs" name="Jobs" />
      <ResourceNSLink resource="daemonsets" name="Daemon Sets" />
      <ResourceNSLink resource="replicasets" name="Replica Sets" />
      <ResourceNSLink resource="replicationcontrollers" name="Replication Controllers" />
      <ResourceNSLink resource="horizontalpodautoscalers" name="Horizontal Pod Autoscalers" />
    </NavSection>

    {/* Temporary addition of Knative Serverless section until extensibility allows for section ordering
        and admin-nav gets contributed through extensions. */}
    <NavSection title="Serverless" />

    <NavSection title="Networking">
      <ResourceNSLink resource="services" name="Services" />
      <ResourceNSLink resource="routes" name="Routes" required={FLAGS.OPENSHIFT} />
      <ResourceNSLink resource="ingresses" name="Ingresses" />
      <ResourceNSLink resource="networkpolicies" name="Network Policies" />
    </NavSection>

    <NavSection title="Storage">
      <ResourceClusterLink
        resource="persistentvolumes"
        name="Persistent Volumes"
        required={FLAGS.CAN_LIST_PV}
      />
      <ResourceNSLink resource="persistentvolumeclaims" name="Persistent Volume Claims" />
      <ResourceClusterLink resource="storageclasses" name="Storage Classes" />
    </NavSection>

    <NavSection title="Builds" required={FLAGS.OPENSHIFT}>
      <ResourceNSLink resource="buildconfigs" name={BuildConfigModel.labelPlural} />
      <ResourceNSLink resource="builds" name={BuildModel.labelPlural} />
      <ResourceNSLink
        resource="imagestreams"
        name={ImageStreamModel.labelPlural}
        startsWith={imagestreamsStartsWith}
      />
    </NavSection>

    {/* Temporary addition of Tekton Pipelines section until extensibility allows for section ordering
        and admin-nav gets contributed through extensions. */}
    <NavSection title="Pipelines" />

    <NavSection title="Service Catalog" required={FLAGS.SERVICE_CATALOG}>
      <HrefLink
        href="/provisionedservices"
        name="Provisioned Services"
        activePath="/provisionedservices/"
        startsWith={provisionedServicesStartsWith}
      />
      <HrefLink
        href="/brokermanagement"
        name="Broker Management"
        activePath="/brokermanagement/"
        startsWith={brokerManagementStartsWith}
      />
    </NavSection>

    <MonitoringNavSection />

    <NavSection title="Compute" required={FLAGS.CAN_LIST_NODE}>
      <ResourceClusterLink resource="nodes" name="Nodes" />
      <HrefLink
        href={formatNamespacedRouteForResource(
          referenceForModel(MachineModel),
          'openshift-machine-api',
        )}
        name="Machines"
        required={FLAGS.CLUSTER_API}
      />
      <HrefLink
        href={formatNamespacedRouteForResource(
          referenceForModel(MachineSetModel),
          'openshift-machine-api',
        )}
        name="Machine Sets"
        required={FLAGS.CLUSTER_API}
      />
      <HrefLink
        href={formatNamespacedRouteForResource(
          referenceForModel(MachineAutoscalerModel),
          'openshift-machine-api',
        )}
        name="Machine Autoscalers"
        required={FLAGS.MACHINE_AUTOSCALER}
      />
      <HrefLink
        href={formatNamespacedRouteForResource(
          referenceForModel(MachineHealthCheckModel),
          'openshift-machine-api',
        )}
        name="Machine Health Checks"
        required={FLAGS.MACHINE_HEALTH_CHECK}
      />
      <Separator required={FLAGS.MACHINE_CONFIG} name="ComputeSeparator" />
      <ResourceClusterLink
        resource={referenceForModel(MachineConfigModel)}
        name="Machine Configs"
        required={FLAGS.MACHINE_CONFIG}
      />
      <ResourceClusterLink
        resource={referenceForModel(MachineConfigPoolModel)}
        name="Machine Config Pools"
        required={FLAGS.MACHINE_CONFIG}
      />
    </NavSection>

    <NavSection title="User Management">
      <ResourceClusterLink
        resource={referenceForModel(UserModel)}
        name="Users"
        required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_USERS]}
      />
      <ResourceClusterLink
        resource={referenceForModel(GroupModel)}
        name="Groups"
        required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_GROUPS]}
      />
      <ResourceNSLink resource="serviceaccounts" name="Service Accounts" />
      <ResourceNSLink resource="roles" name="Roles" startsWith={rolesStartsWith} />
      <ResourceNSLink
        resource="rolebindings"
        name="Role Bindings"
        startsWith={rolebindingsStartsWith}
      />
    </NavSection>

    <NavSection title="Administration">
      <HrefLink
        href="/settings/cluster"
        activePath="/settings/cluster/"
        name="Cluster Settings"
        required={FLAGS.CLUSTER_VERSION}
        startsWith={clusterSettingsStartsWith}
      />
      <ResourceClusterLink resource="namespaces" name="Namespaces" required={FLAGS.CAN_LIST_NS} />
      <ResourceNSLink
        resource="resourcequotas"
        name="Resource Quotas"
        startsWith={quotaStartsWith}
      />
      <ResourceNSLink resource="limitranges" name="Limit Ranges" />
      <HrefLink
        href={formatNamespacedRouteForResource(
          referenceForModel(ChargebackReportModel),
          'openshift-metering',
        )}
        name="Chargeback"
        required={[FLAGS.CHARGEBACK, FLAGS.CAN_LIST_CHARGEBACK_REPORTS]}
        startsWith={meteringStartsWith}
      />
      <ResourceClusterLink
        resource="customresourcedefinitions"
        name="Custom Resource Definitions"
        required={FLAGS.CAN_LIST_CRD}
      />
    </NavSection>
  </>
);

export default AdminNav;
