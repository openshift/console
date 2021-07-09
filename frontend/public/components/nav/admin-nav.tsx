import * as React from 'react';
import { connect } from 'react-redux';
import { NavList, NavItemSeparator } from '@patternfly/react-core';
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
  return canAccess && !!window.SERVER_FLAGS.prometheusBaseURL ? (
    <NavSection id="observe" title={t('public~Observe')} data-quickstart-id="qs-nav-monitoring">
      <HrefLink
        id="monitoringalerts"
        href="/monitoring/alerts"
        name={t('public~Alerting')}
        startsWith={monitoringAlertsStartsWith}
      />
      <HrefLink
        id="monitoringmetrics"
        href="/monitoring/query-browser?query0="
        name={t('public~Metrics')}
        startsWith={['monitoring/query-browser']}
      />
      <HrefLink
        id="monitoringdashboards"
        href="/monitoring/dashboards"
        name={t('public~Dashboards')}
      />
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
    <NavList>
      <NavSection id="home" title={t('public~Home')} data-quickstart-id="qs-nav-home">
        <HrefLink
          id="dashboards"
          href="/dashboards"
          activePath="/dashboards/"
          name={t('public~Overview')}
          required={[FLAGS.CAN_GET_NS, FLAGS.OPENSHIFT]}
        />
        <ResourceClusterLink
          id="projects"
          resource="projects"
          name={t('public~Projects')}
          required={FLAGS.OPENSHIFT}
        />
        <HrefLink
          id="search"
          href="/search"
          namespaced
          name={t('public~Search')}
          startsWith={searchStartsWith}
        />
        <HrefLink
          id="explore"
          href="/api-explorer"
          name={t('public~API Explorer')}
          startsWith={apiExplorerStartsWith}
        />
        <ResourceNSLink id="events" resource="events" name={t('public~Events')} />
      </NavSection>

      <NavSection
        id="operators"
        title={t('public~Operators')}
        data-quickstart-id="qs-nav-operators"
      />

      <NavSection
        id="workloads"
        title={t('public~Workloads')}
        data-quickstart-id="qs-nav-workloads"
      >
        <ResourceNSLink id="pods" resource="pods" name={t('public~Pods')} />
        <ResourceNSLink id="deployments" resource="deployments" name={t('public~Deployments')} />
        <ResourceNSLink
          id="deploymentconfigs"
          resource="deploymentconfigs"
          name={t('public~DeploymentConfigs')}
          required={FLAGS.OPENSHIFT}
        />
        <ResourceNSLink id="statefulsets" resource="statefulsets" name={t('public~StatefulSets')} />
        <ResourceNSLink id="secrets" resource="secrets" name={t('public~Secrets')} />
        <ResourceNSLink id="configmaps" resource="configmaps" name={t('public~ConfigMaps')} />
        <Separator id="WorkloadsSeparator" name={t('public~WorkloadsSeparator')} />
        <ResourceNSLink id="cronjobs" resource="cronjobs" name={t('public~CronJobs')} />
        <ResourceNSLink id="jobs" resource="jobs" name={t('public~Jobs')} />
        <ResourceNSLink id="daemonsets" resource="daemonsets" name={t('public~DaemonSets')} />
        <ResourceNSLink id="replicasets" resource="replicasets" name={t('public~ReplicaSets')} />
        <ResourceNSLink
          id="replicationcontrollers"
          resource="replicationcontrollers"
          name={t('public~ReplicationControllers')}
        />
        <ResourceNSLink
          id="horizontalpodautoscalers"
          resource="horizontalpodautoscalers"
          name={t('public~HorizontalPodAutoscalers')}
        />
      </NavSection>

      {/* Temporary addition of Knative Serverless section until extensibility allows for section ordering
          and admin-nav gets contributed through extensions. */}
      <NavSection
        id="serverless"
        title={t('public~Serverless')}
        data-quickstart-id="qs-nav-serverless"
      />

      <NavSection
        id="networking"
        title={t('public~Networking')}
        data-quickstart-id="qs-nav-networking"
      >
        <ResourceNSLink id="services" resource="services" name={t('public~Services')} />
        <ResourceNSLink
          id="routes"
          resource="routes"
          name={t('public~Routes')}
          required={FLAGS.OPENSHIFT}
        />
        <ResourceNSLink id="ingresses" resource="ingresses" name={t('public~Ingresses')} />
        <ResourceNSLink
          id="networkpolicies"
          resource="networkpolicies"
          name={t('public~NetworkPolicies')}
        />
      </NavSection>

      <NavSection id="storage" title={t('public~Storage')} data-quickstart-id="qs-nav-storage">
        <ResourceClusterLink
          id="persistentvolumes"
          resource="persistentvolumes"
          name={t('public~PersistentVolumes')}
          required={FLAGS.CAN_LIST_PV}
        />
        <ResourceNSLink
          id="persistentvolumeclaims"
          resource="persistentvolumeclaims"
          name={t('public~PersistentVolumeClaims')}
        />
        <ResourceClusterLink
          id="storageclasses"
          resource="storageclasses"
          name={t('public~StorageClasses')}
        />
        <ResourceNSLink
          id="volumesnapshots"
          resource={referenceForModel(VolumeSnapshotModel)}
          name={t('public~VolumeSnapshots')}
        />
        <ResourceClusterLink
          id="volumesnapshotclasses"
          resource={referenceForModel(VolumeSnapshotClassModel)}
          name={t('public~VolumeSnapshotClasses')}
        />
      </NavSection>

      <NavSection
        id="builds"
        title={t('public~Builds')}
        required={FLAGS.OPENSHIFT}
        data-quickstart-id="qs-nav-builds"
      >
        <ResourceNSLink id="buildconfigs" resource="buildconfigs" name={t('public~BuildConfigs')} />
        <ResourceNSLink id="builds" resource="builds" name={t('public~Builds')} />
        <ResourceNSLink
          id="imagestreams"
          resource="imagestreams"
          name={t('public~ImageStreams')}
          startsWith={imagestreamsStartsWith}
        />
      </NavSection>

      {/* Temporary addition of Tekton Pipelines section until extensibility allows for section ordering
          and admin-nav gets contributed through extensions. */}
      <NavSection
        id="pipelines"
        title={t('public~Pipelines')}
        data-quickstart-id="qs-nav-pipelines"
      />

      <NavSection
        id="servicecatalog"
        title={t('public~Service Catalog')}
        required={FLAGS.SERVICE_CATALOG}
        data-quickstart-id="qs-nav-servicecatalog"
      >
        <HrefLink
          id="provisionedservices"
          href="/provisionedservices"
          namespaced
          name={t('public~Provisioned Services')}
          activePath="/provisionedservices/"
          startsWith={provisionedServicesStartsWith}
        />
        <HrefLink
          id="brokermanagement"
          href="/brokermanagement"
          name={t('public~Broker Management')}
          activePath="/brokermanagement/"
          startsWith={brokerManagementStartsWith}
        />
      </NavSection>

      <MonitoringNavSection />

      <NavSection
        id="compute"
        title={t('public~Compute')}
        required={FLAGS.CAN_LIST_NODE}
        data-quickstart-id="qs-nav-compute"
      >
        <ResourceClusterLink id="nodes" resource="nodes" name={t('public~Nodes')} />
        <HrefLink
          id="machines"
          href={formatNamespacedRouteForResource(referenceForModel(MachineModel), machineNS)}
          name={t('public~Machines')}
          required={FLAGS.CLUSTER_API}
        />
        <HrefLink
          id="machinesets"
          href={formatNamespacedRouteForResource(referenceForModel(MachineSetModel), machineNS)}
          name={t('public~MachineSets')}
          required={FLAGS.CLUSTER_API}
        />
        <HrefLink
          id="machineautoscaler"
          href={formatNamespacedRouteForResource(
            referenceForModel(MachineAutoscalerModel),
            machineNS,
          )}
          name={t('public~MachineAutoscalers')}
          required={FLAGS.MACHINE_AUTOSCALER}
        />
        <HrefLink
          id="machinehealthchecks"
          href={formatNamespacedRouteForResource(
            referenceForModel(MachineHealthCheckModel),
            machineNS,
          )}
          name={t('public~MachineHealthChecks')}
          required={FLAGS.MACHINE_HEALTH_CHECK}
        />
        <Separator
          id="computeseparator"
          required={FLAGS.MACHINE_CONFIG}
          name={t('public~ComputeSeparator')}
        />
        <ResourceClusterLink
          id="machineconfigs"
          resource={referenceForModel(MachineConfigModel)}
          name={t('public~MachineConfigs')}
          required={FLAGS.MACHINE_CONFIG}
        />
        <ResourceClusterLink
          id="machineconfigpools"
          resource={referenceForModel(MachineConfigPoolModel)}
          name={t('public~MachineConfigPools')}
          required={FLAGS.MACHINE_CONFIG}
        />
      </NavSection>

      <NavSection
        id="usermanagement"
        title={t('public~User Management')}
        data-quickstart-id="qs-nav-usermanagement"
      >
        <ResourceClusterLink
          id="users"
          resource={referenceForModel(UserModel)}
          name={t('public~Users')}
          required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_USERS]}
        />
        <ResourceClusterLink
          id="groups"
          resource={referenceForModel(GroupModel)}
          name={t('public~Groups')}
          required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_GROUPS]}
        />
        <ResourceNSLink
          id="serviceaccounts"
          resource="serviceaccounts"
          name={t('public~ServiceAccounts')}
        />
        <ResourceNSLink
          id="roles"
          resource="roles"
          name={t('public~Roles')}
          startsWith={rolesStartsWith}
        />
        <ResourceNSLink
          id="rolebindings"
          resource="rolebindings"
          name={t('public~RoleBindings')}
          startsWith={rolebindingsStartsWith}
        />
      </NavSection>

      <NavSection
        id="administration"
        title={t('public~Administration')}
        data-quickstart-id="qs-nav-administration"
      >
        <HrefLink
          id="clustersettings"
          href="/settings/cluster"
          activePath="/settings/cluster/"
          name={t('public~Cluster Settings')}
          required={FLAGS.CLUSTER_VERSION}
          startsWith={clusterSettingsStartsWith}
        />
        <ResourceClusterLink
          id="namespaces"
          resource="namespaces"
          name={t('public~Namespaces')}
          required={FLAGS.CAN_LIST_NS}
        />
        <ResourceNSLink
          id="resourcequotas"
          resource="resourcequotas"
          name={t('public~ResourceQuotas')}
          startsWith={quotaStartsWith}
        />
        <ResourceNSLink id="roles" resource="limitranges" name={t('public~LimitRanges')} />
        <HrefLink
          id="metering"
          href={formatNamespacedRouteForResource(
            referenceForModel(ChargebackReportModel),
            'openshift-metering',
          )}
          name={t('public~Chargeback')}
          required={[FLAGS.CHARGEBACK, FLAGS.CAN_LIST_CHARGEBACK_REPORTS]}
          startsWith={meteringStartsWith}
        />
        <ResourceClusterLink
          id="customresourcedefinitions"
          resource="customresourcedefinitions"
          name={t('public~CustomResourceDefinitions')}
          required={FLAGS.CAN_LIST_CRD}
        />
      </NavSection>
    </NavList>
  );
};

export default AdminNav;
