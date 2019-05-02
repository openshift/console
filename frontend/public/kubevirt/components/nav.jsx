import * as React from 'react';

import { FLAGS } from '../../features';

import { NavSection } from './okdcomponents';
import {
  ChargebackReportModel,
  DeploymentConfigModel,
  MachineModel,
  MachineSetModel,
  MachineConfigModel,
  MachineConfigPoolModel,
} from '../models';
import { referenceForModel } from '../module/okdk8s';
import { VmTemplatesPageTitle } from './vm-template';

import { Nav, NavList } from '@patternfly/react-core';

// With respect to keep changes to OKD codebase at bare minimum,
// the navigation needs to be reconstructed.
// The ResourceNSLink, HrefLink, MonitoringNavSection components are passed as props to eliminate the need for additional changes in OKD core code. Ugly anti-pattern, but serves its purpose.

const PageNav = ({ onNavSelect, ResourceClusterLink, HrefLink, ResourceNSLink, MonitoringNavSection, searchStartsWith, rolesStartsWith, rolebindingsStartsWith, quotaStartsWith }) => (
  <Nav aria-label="Nav" onSelect={onNavSelect}>
    <NavList>
      <NavSection title="Home">
        <HrefLink href="/dashboards" name="Dashboards" activePath="/dashboards/" required={FLAGS.OPENSHIFT} />
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

      <NavSection title="Workloads">
        <ResourceNSLink resource="virtualmachines" name="Virtual Machines" />
        <ResourceNSLink resource="vmtemplates" name={VmTemplatesPageTitle} />

        <ResourceNSLink resource="pods" name="Pods" />
        <ResourceNSLink resource="deployments" name="Deployments" />
        <ResourceNSLink resource="deploymentconfigs" name={DeploymentConfigModel.labelPlural} required={FLAGS.OPENSHIFT} />
        <ResourceNSLink resource="statefulsets" name="Stateful Sets" />
        <ResourceNSLink resource="secrets" name="Secrets" />
        <ResourceNSLink resource="configmaps" name="Config Maps" />
        <ResourceNSLink resource="cronjobs" name="Cron Jobs" />
        <ResourceNSLink resource="jobs" name="Jobs" />
        <ResourceNSLink resource="daemonsets" name="Daemon Sets" />
        <ResourceNSLink resource="replicasets" name="Replica Sets" />
        <ResourceNSLink resource="replicationcontrollers" name="Replication Controllers" />
        <ResourceNSLink resource="horizontalpodautoscalers" name="HPAs" />
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

      <MonitoringNavSection />

      <NavSection title="Compute" required={FLAGS.CAN_LIST_NODE}>
        <ResourceClusterLink resource="nodes" name="Nodes" />
        <ResourceNSLink resource={referenceForModel(MachineModel)} name="Machines" required={FLAGS.CLUSTER_API} />
        <ResourceNSLink resource={referenceForModel(MachineSetModel)} name="Machine Sets" required={FLAGS.CLUSTER_API} />
        <ResourceNSLink resource="baremetalhosts" name="Bare Metal Hosts" required={FLAGS.METALKUBE} isSeparated />
        <ResourceClusterLink resource={referenceForModel(MachineConfigModel)} name="Machine Configs" required={FLAGS.MACHINE_CONFIG} />
        <ResourceClusterLink resource={referenceForModel(MachineConfigPoolModel)} name="Machine Config Pools" required={FLAGS.MACHINE_CONFIG} />
      </NavSection>

      <NavSection title="Administration">
        <HrefLink href="/settings/cluster" activePath="/settings/cluster/" name="Cluster Settings" required={FLAGS.CLUSTER_VERSION} />
        <ResourceClusterLink resource="namespaces" name="Namespaces" required={FLAGS.CAN_LIST_NS} />
        <ResourceNSLink resource="serviceaccounts" name="Service Accounts" />
        <ResourceNSLink resource="roles" name="Roles" startsWith={rolesStartsWith} />
        <ResourceNSLink resource="rolebindings" name="Role Bindings" startsWith={rolebindingsStartsWith} />
        <ResourceNSLink resource="resourcequotas" name="Resource Quotas" startsWith={quotaStartsWith} />
        <ResourceNSLink resource="limitranges" name="Limit Ranges" />
        <ResourceNSLink resource={referenceForModel(ChargebackReportModel)} name="Chargeback" disallowed={FLAGS.OPENSHIFT} />
        <ResourceClusterLink resource="customresourcedefinitions" name="CRDs" required={FLAGS.CAN_LIST_CRD} />
      </NavSection>
    </NavList>
  </Nav>
);

export default PageNav;
