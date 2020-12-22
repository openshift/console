import * as React from 'react';
import { connect } from 'react-redux';
import { NavItemSeparator } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { FLAGS, useActiveNamespace } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import { featureReducerName } from '../../reducers/features';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';

import {
  ChargebackReportModel,
  GroupModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineConfigPoolModel,
  MachineHealthCheckModel,
  MachineModel,
  MachineSetModel,
  UserModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
} from '../../models';

import { referenceForModel } from '../../module/k8s';
import { HrefLink, ResourceNSLink, ResourceClusterLink } from './items';
import { NavSection } from './section';

type SeparatorProps = {
  name: string;
  id?: string;
  required?: string;
};

// Wrap `NavItemSeparator` so we can use `required` without prop type errors.
const Separator: React.FC<SeparatorProps> = ({ name, id }) => (
  <NavItemSeparator name={name} id={id} />
);

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
});

const MonitoringNavSection_ = ({ canAccess }) => {
  const { t } = useTranslation();
  const canAccessPrometheus = canAccess && !!window.SERVER_FLAGS.prometheusBaseURL;
  const showSilences = canAccess && !!window.SERVER_FLAGS.alertManagerBaseURL;
  return canAccessPrometheus || showSilences ? (
    <NavSection id="monitoring" title={t('nav~Monitoring')} data-quickstart-id="qs-nav-monitoring">
      {canAccessPrometheus && (
        <HrefLink
          id="monitoringalerts"
          href="/monitoring/alerts"
          name={t('nav~Alerting')}
          startsWith={monitoringAlertsStartsWith}
        />
      )}
      {canAccessPrometheus && (
        <HrefLink
          id="monitoringmetrics"
          href="/monitoring/query-browser?query0="
          name={t('nav~Metrics')}
          startsWith={['monitoring/query-browser']}
        />
      )}
      {canAccessPrometheus && (
        <HrefLink
          id="monitoringdashboards"
          href="/monitoring/dashboards"
          name={t('nav~Dashboards')}
        />
      )}
    </NavSection>
  ) : null;
};
const MonitoringNavSection = connect(monitoringNavSectionStateToProps)(MonitoringNavSection_);

const AdminNav = () => {
  const lastNamespace = useActiveNamespace()[0];
  // In OpenShift, machines are created in the openshift-machine-api namespace.
  // Switch to that namespace so the list isn't empty.
  // If "all projects" was last selected, however, use "all projects" instead.
  const machineNS = lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : 'openshift-machine-api';
  const { t } = useTranslation();
  return (
    <>
      <NavSection id="home" title={t('nav~Home')} data-quickstart-id="qs-nav-home">
        <HrefLink
          id="dashboards"
          href="/dashboards"
          activePath="/dashboards/"
          name={t('nav~Overview')}
          required={[FLAGS.CAN_GET_NS, FLAGS.OPENSHIFT]}
        />
        <ResourceClusterLink
          id="projects"
          resource="projects"
          name={t('nav~Projects')}
          required={FLAGS.OPENSHIFT}
        />
        <HrefLink id="search" href="/search" name={t('nav~Search')} startsWith={searchStartsWith} />
        <HrefLink
          id="explore"
          href="/api-explorer"
          name={t('nav~Explore')}
          startsWith={apiExplorerStartsWith}
        />
        <ResourceNSLink id="events" resource="events" name={t('nav~Events')} />
      </NavSection>

      <NavSection id="operators" title={t('nav~Operators')} data-quickstart-id="qs-nav-operators" />

      <NavSection id="workloads" title={t('nav~Workloads')} data-quickstart-id="qs-nav-workloads">
        <ResourceNSLink id="pods" resource="pods" name={t('nav~Pods')} />
        <ResourceNSLink id="deployments" resource="deployments" name={t('nav~Deployments')} />
        <ResourceNSLink
          id="deploymentconfigs"
          resource="deploymentconfigs"
          name={t('nav~Deployment Configs')}
          required={FLAGS.OPENSHIFT}
        />
        <ResourceNSLink id="statefulsets" resource="statefulsets" name={t('nav~Stateful Sets')} />
        <ResourceNSLink id="secrets" resource="secrets" name={t('nav~Secrets')} />
        <ResourceNSLink id="configmaps" resource="configmaps" name={t('nav~Config Maps')} />
        <Separator id="WorkloadsSeparator" name={t('nav~WorkloadsSeparator')} />
        <ResourceNSLink id="cronjobs" resource="cronjobs" name={t('nav~Cron Jobs')} />
        <ResourceNSLink id="jobs" resource="jobs" name={t('nav~Jobs')} />
        <ResourceNSLink id="daemonsets" resource="daemonsets" name={t('nav~Daemon Sets')} />
        <ResourceNSLink id="replicasets" resource="replicasets" name={t('nav~Replica Sets')} />
        <ResourceNSLink
          id="replicationcontrollers"
          resource="replicationcontrollers"
          name={t('nav~Replication Controllers')}
        />
        <ResourceNSLink
          id="horizontalpodautoscalers"
          resource="horizontalpodautoscalers"
          name={t('nav~Horizontal Pod Autoscalers')}
        />
      </NavSection>

      {/* Temporary addition of Knative Serverless section until extensibility allows for section ordering
          and admin-nav gets contributed through extensions. */}
      <NavSection
        id="serverless"
        title={t('nav~Serverless')}
        data-quickstart-id="qs-nav-serverless"
      />

      <NavSection
        id="networking"
        title={t('nav~Networking')}
        data-quickstart-id="qs-nav-networking"
      >
        <ResourceNSLink id="services" resource="services" name={t('nav~Services')} />
        <ResourceNSLink
          id="routes"
          resource="routes"
          name={t('nav~Routes')}
          required={FLAGS.OPENSHIFT}
        />
        <ResourceNSLink id="ingresses" resource="ingresses" name={t('nav~Ingresses')} />
        <ResourceNSLink
          id="networkpolicies"
          resource="networkpolicies"
          name={t('nav~Network Policies')}
        />
      </NavSection>

      <NavSection id="storage" title={t('nav~Storage')} data-quickstart-id="qs-nav-storage">
        <ResourceClusterLink
          id="networkpolicies"
          resource="persistentvolumes"
          name={t('nav~Persistent Volumes')}
          required={FLAGS.CAN_LIST_PV}
        />
        <ResourceNSLink
          id="persistentvolumeclaims"
          resource="persistentvolumeclaims"
          name={t('nav~Persistent Volume Claims')}
        />
        <ResourceClusterLink
          id="storageclasses"
          resource="storageclasses"
          name={t('nav~Storage Classes')}
        />
        <ResourceNSLink
          id="volumesnapshots"
          resource={referenceForModel(VolumeSnapshotModel)}
          name={t('nav~Volume Snapshots')}
        />
        <ResourceClusterLink
          id="volumesnapshotclasses"
          resource={referenceForModel(VolumeSnapshotClassModel)}
          name={t('nav~Volume Snapshot Classes')}
        />
      </NavSection>

      <NavSection
        id="builds"
        title={t('nav~Builds')}
        required={FLAGS.OPENSHIFT}
        data-quickstart-id="qs-nav-builds"
      >
        <ResourceNSLink id="buildconfigs" resource="buildconfigs" name={t('nav~Build Configs')} />
        <ResourceNSLink id="builds" resource="builds" name={t('nav~Builds')} />
        <ResourceNSLink
          id="imagestreams"
          resource="imagestreams"
          name={t('nav~Image Streams')}
          startsWith={imagestreamsStartsWith}
        />
      </NavSection>

      {/* Temporary addition of Tekton Pipelines section until extensibility allows for section ordering
          and admin-nav gets contributed through extensions. */}
      <NavSection id="pipelines" title={t('nav~Pipelines')} data-quickstart-id="qs-nav-pipelines" />

      <NavSection
        id="servicecatalog"
        title={t('nav~Service Catalog')}
        required={FLAGS.SERVICE_CATALOG}
        data-quickstart-id="qs-nav-servicecatalog"
      >
        <HrefLink
          id="provisionedservices"
          href="/provisionedservices"
          name={t('nav~Provisioned Services')}
          activePath="/provisionedservices/"
          startsWith={provisionedServicesStartsWith}
        />
        <HrefLink
          id="brokermanagement"
          href="/brokermanagement"
          name={t('nav~Broker Management')}
          activePath="/brokermanagement/"
          startsWith={brokerManagementStartsWith}
        />
      </NavSection>

      <MonitoringNavSection />

      <NavSection
        id="compute"
        title={t('nav~Compute')}
        required={FLAGS.CAN_LIST_NODE}
        data-quickstart-id="qs-nav-compute"
      >
        <ResourceClusterLink id="nodes" resource="nodes" name={t('nav~Nodes')} />
        <HrefLink
          id="machines"
          href={formatNamespacedRouteForResource(referenceForModel(MachineModel), machineNS)}
          name={t('nav~Machines')}
          required={FLAGS.CLUSTER_API}
        />
        <HrefLink
          id="machinesets"
          href={formatNamespacedRouteForResource(referenceForModel(MachineSetModel), machineNS)}
          name={t('nav~Machine Sets')}
          required={FLAGS.CLUSTER_API}
        />
        <HrefLink
          id="machineautoscaler"
          href={formatNamespacedRouteForResource(
            referenceForModel(MachineAutoscalerModel),
            machineNS,
          )}
          name={t('nav~Machine Autoscalers')}
          required={FLAGS.MACHINE_AUTOSCALER}
        />
        <HrefLink
          id="machinehealthchecks"
          href={formatNamespacedRouteForResource(
            referenceForModel(MachineHealthCheckModel),
            machineNS,
          )}
          name={t('nav~Machine Health Checks')}
          required={FLAGS.MACHINE_HEALTH_CHECK}
        />
        <Separator
          id="computeseparator"
          required={FLAGS.MACHINE_CONFIG}
          name={t('nav~ComputeSeparator')}
        />
        <ResourceClusterLink
          id="machineconfigs"
          resource={referenceForModel(MachineConfigModel)}
          name={t('nav~Machine Configs')}
          required={FLAGS.MACHINE_CONFIG}
        />
        <ResourceClusterLink
          id="machineconfigpools"
          resource={referenceForModel(MachineConfigPoolModel)}
          name={t('nav~Machine Config Pools')}
          required={FLAGS.MACHINE_CONFIG}
        />
      </NavSection>

      <NavSection
        id="usermanagement"
        title={t('nav~User Management')}
        data-quickstart-id="qs-nav-usermanagement"
      >
        <ResourceClusterLink
          id="users"
          resource={referenceForModel(UserModel)}
          name={t('nav~Users')}
          required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_USERS]}
        />
        <ResourceClusterLink
          id="groups"
          resource={referenceForModel(GroupModel)}
          name={t('nav~Groups')}
          required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_GROUPS]}
        />
        <ResourceNSLink
          id="serviceaccounts"
          resource="serviceaccounts"
          name={t('nav~Service Accounts')}
        />
        <ResourceNSLink
          id="roles"
          resource="roles"
          name={t('nav~Roles')}
          startsWith={rolesStartsWith}
        />
        <ResourceNSLink
          id="rolebindings"
          resource="rolebindings"
          name={t('nav~Role Bindings')}
          startsWith={rolebindingsStartsWith}
        />
      </NavSection>

      <NavSection
        id="administration"
        title={t('nav~Administration')}
        data-quickstart-id="qs-nav-administration"
      >
        <HrefLink
          id="clustersettings"
          href="/settings/cluster"
          activePath="/settings/cluster/"
          name={t('nav~Cluster Settings')}
          required={FLAGS.CLUSTER_VERSION}
          startsWith={clusterSettingsStartsWith}
        />
        <ResourceClusterLink
          id="namespaces"
          resource="namespaces"
          name={t('nav~Namespaces')}
          required={FLAGS.CAN_LIST_NS}
        />
        <ResourceNSLink
          id="resourcequotas"
          resource="resourcequotas"
          name={t('nav~Resource Quotas')}
          startsWith={quotaStartsWith}
        />
        <ResourceNSLink id="roles" resource="limitranges" name={t('nav~Limit Ranges')} />
        <HrefLink
          id="metering"
          href={formatNamespacedRouteForResource(
            referenceForModel(ChargebackReportModel),
            'openshift-metering',
          )}
          name={t('nav~Chargeback')}
          required={[FLAGS.CHARGEBACK, FLAGS.CAN_LIST_CHARGEBACK_REPORTS]}
          startsWith={meteringStartsWith}
        />
        <ResourceClusterLink
          id="customresourcedefinitions"
          resource="customresourcedefinitions"
          name={t('nav~Custom Resource Definitions')}
          required={FLAGS.CAN_LIST_CRD}
        />
      </NavSection>
    </>
  );
};

export default AdminNav;
