import * as React from 'react';
import { connect } from 'react-redux';
import { NavItemSeparator } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { FLAGS } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import { featureReducerName } from '../../reducers/features';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';

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
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
} from '../../models';

import { referenceForModel } from '../../module/k8s';
import { HrefLink, ResourceNSLink, ResourceClusterLink } from './items';
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
});

const MonitoringNavSection_ = ({ canAccess }) => {
  const { t } = useTranslation();
  const canAccessPrometheus = canAccess && !!window.SERVER_FLAGS.prometheusBaseURL;
  const showSilences = canAccess && !!window.SERVER_FLAGS.alertManagerBaseURL;
  return canAccessPrometheus || showSilences ? (
    <NavSection title={t('nav~Monitoring')}>
      {canAccessPrometheus && (
        <HrefLink
          href="/monitoring/alerts"
          name={t('nav~Alerting')}
          startsWith={monitoringAlertsStartsWith}
        />
      )}
      {canAccessPrometheus && (
        <HrefLink
          href="/monitoring/query-browser?query0="
          name={t('nav~Metrics')}
          startsWith={['monitoring/query-browser']}
        />
      )}
      {canAccessPrometheus && <HrefLink href="/monitoring/dashboards" name={t('nav~Dashboards')} />}
    </NavSection>
  ) : null;
};
const MonitoringNavSection = connect(monitoringNavSectionStateToProps)(MonitoringNavSection_);

const AdminNav = () => {
  const lastNamespace = localStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
  // In OpenShift, machines are created in the openshift-machine-api namespace.
  // Switch to that namespace so the list isn't empty.
  // If "all projects" was last selected, however, use "all projects" instead.
  const machineNS = lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : 'openshift-machine-api';
  const { t } = useTranslation();
  return (
    <>
      <NavSection title={t('nav~Home')}>
        <HrefLink
          href="/dashboards"
          activePath="/dashboards/"
          name={t('nav~Overview')}
          required={[FLAGS.CAN_GET_NS, FLAGS.OPENSHIFT]}
        />
        <ResourceClusterLink
          resource="projects"
          name={t('nav~Projects')}
          required={FLAGS.OPENSHIFT}
        />
        <HrefLink href="/search" name={t('nav~Search')} startsWith={searchStartsWith} />
        <HrefLink href="/api-explorer" name={t('nav~Explore')} startsWith={apiExplorerStartsWith} />
        <ResourceNSLink resource="events" name={t('nav~Events')} />
      </NavSection>

      <NavSection title={t('nav~Operators')} />

      <NavSection title={t('nav~Workloads')}>
        <ResourceNSLink resource="pods" name={t('nav~Pods')} />
        <ResourceNSLink resource="deployments" name={t('nav~Deployments')} />
        <ResourceNSLink
          resource="deploymentconfigs"
          name={DeploymentConfigModel.labelPlural}
          required={FLAGS.OPENSHIFT}
        />
        <ResourceNSLink resource="statefulsets" name={t('nav~Stateful Sets')} />
        <ResourceNSLink resource="secrets" name={t('nav~Secrets')} />
        <ResourceNSLink resource="configmaps" name={t('nav~Config Maps')} />
        <Separator name={t('nav~WorkloadsSeparator')} />
        <ResourceNSLink resource="cronjobs" name={t('nav~Cron Jobs')} />
        <ResourceNSLink resource="jobs" name={t('nav~Jobs')} />
        <ResourceNSLink resource="daemonsets" name={t('nav~Daemon Sets')} />
        <ResourceNSLink resource="replicasets" name={t('nav~Replica Sets')} />
        <ResourceNSLink resource="replicationcontrollers" name={t('nav~Replication Controllers')} />
        <ResourceNSLink
          resource="horizontalpodautoscalers"
          name={t('nav~Horizontal Pod Autoscalers')}
        />
      </NavSection>

      {/* Temporary addition of Knative Serverless section until extensibility allows for section ordering
          and admin-nav gets contributed through extensions. */}
      <NavSection title={t('nav~Serverless')} />

      <NavSection title={t('nav~Networking')}>
        <ResourceNSLink resource="services" name={t('nav~Services')} />
        <ResourceNSLink resource="routes" name={t('nav~Routes')} required={FLAGS.OPENSHIFT} />
        <ResourceNSLink resource="ingresses" name={t('nav~Ingresses')} />
        <ResourceNSLink resource="networkpolicies" name={t('nav~Network Policies')} />
      </NavSection>

      <NavSection title={t('nav~Storage')}>
        <ResourceClusterLink
          resource="persistentvolumes"
          name={t('nav~Persistent Volumes')}
          required={FLAGS.CAN_LIST_PV}
        />
        <ResourceNSLink
          resource="persistentvolumeclaims"
          name={t('nav~Persistent Volume Claims')}
        />
        <ResourceClusterLink resource="storageclasses" name={t('nav~Storage Classes')} />
        <ResourceNSLink
          resource={referenceForModel(VolumeSnapshotModel)}
          name={t('nav~Volume Snapshots')}
        />
        <ResourceClusterLink
          resource={referenceForModel(VolumeSnapshotClassModel)}
          name={t('nav~Volume Snapshot Classes')}
        />
      </NavSection>

      <NavSection title={t('nav~Builds')} required={FLAGS.OPENSHIFT}>
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
      <NavSection title={t('nav~Pipelines')} />

      <NavSection title={t('nav~Service Catalog')} required={FLAGS.SERVICE_CATALOG}>
        <HrefLink
          href="/provisionedservices"
          name={t('nav~Provisioned Services')}
          activePath="/provisionedservices/"
          startsWith={provisionedServicesStartsWith}
        />
        <HrefLink
          href="/brokermanagement"
          name={t('nav~Broker Management')}
          activePath="/brokermanagement/"
          startsWith={brokerManagementStartsWith}
        />
      </NavSection>

      <MonitoringNavSection />

      <NavSection title={t('nav~Compute')} required={FLAGS.CAN_LIST_NODE}>
        <ResourceClusterLink resource="nodes" name={t('nav~Nodes')} />
        <HrefLink
          href={formatNamespacedRouteForResource(referenceForModel(MachineModel), machineNS)}
          name={t('nav~Machines')}
          required={FLAGS.CLUSTER_API}
        />
        <HrefLink
          href={formatNamespacedRouteForResource(referenceForModel(MachineSetModel), machineNS)}
          name={t('nav~Machine Sets')}
          required={FLAGS.CLUSTER_API}
        />
        <HrefLink
          href={formatNamespacedRouteForResource(
            referenceForModel(MachineAutoscalerModel),
            machineNS,
          )}
          name={t('nav~Machine Autoscalers')}
          required={FLAGS.MACHINE_AUTOSCALER}
        />
        <HrefLink
          href={formatNamespacedRouteForResource(
            referenceForModel(MachineHealthCheckModel),
            machineNS,
          )}
          name={t('nav~Machine Health Checks')}
          required={FLAGS.MACHINE_HEALTH_CHECK}
        />
        <Separator required={FLAGS.MACHINE_CONFIG} name={t('nav~ComputeSeparator')} />
        <ResourceClusterLink
          resource={referenceForModel(MachineConfigModel)}
          name={t('nav~Machine Configs')}
          required={FLAGS.MACHINE_CONFIG}
        />
        <ResourceClusterLink
          resource={referenceForModel(MachineConfigPoolModel)}
          name={t('nav~Machine Config Pools')}
          required={FLAGS.MACHINE_CONFIG}
        />
      </NavSection>

      <NavSection title={t('nav~User Management')}>
        <ResourceClusterLink
          resource={referenceForModel(UserModel)}
          name={t('nav~Users')}
          required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_USERS]}
        />
        <ResourceClusterLink
          resource={referenceForModel(GroupModel)}
          name={t('nav~Groups')}
          required={[FLAGS.OPENSHIFT, FLAGS.CAN_LIST_GROUPS]}
        />
        <ResourceNSLink resource="serviceaccounts" name={t('nav~Service Accounts')} />
        <ResourceNSLink resource="roles" name={t('nav~Roles')} startsWith={rolesStartsWith} />
        <ResourceNSLink
          resource="rolebindings"
          name={t('nav~Role Bindings')}
          startsWith={rolebindingsStartsWith}
        />
      </NavSection>

      <NavSection title={t('nav~Administration')}>
        <HrefLink
          href="/settings/cluster"
          activePath="/settings/cluster/"
          name={t('nav~Cluster Settings')}
          required={FLAGS.CLUSTER_VERSION}
          startsWith={clusterSettingsStartsWith}
        />
        <ResourceClusterLink
          resource="namespaces"
          name={t('nav~Namespaces')}
          required={FLAGS.CAN_LIST_NS}
        />
        <ResourceNSLink
          resource="resourcequotas"
          name={t('nav~Resource Quotas')}
          startsWith={quotaStartsWith}
        />
        <ResourceNSLink resource="limitranges" name={t('nav~Limit Ranges')} />
        <HrefLink
          href={formatNamespacedRouteForResource(
            referenceForModel(ChargebackReportModel),
            'openshift-metering',
          )}
          name={t('nav~Chargeback')}
          required={[FLAGS.CHARGEBACK, FLAGS.CAN_LIST_CHARGEBACK_REPORTS]}
          startsWith={meteringStartsWith}
        />
        <ResourceClusterLink
          resource="customresourcedefinitions"
          name={t('nav~Custom Resource Definitions')}
          required={FLAGS.CAN_LIST_CRD}
        />
      </NavSection>
    </>
  );
};

export default AdminNav;
