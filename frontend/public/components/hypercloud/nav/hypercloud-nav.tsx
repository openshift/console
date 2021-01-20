import * as React from 'react';

import { Translation } from 'react-i18next';
// import { GroupModel, UserModel } from '../../../models';

// import { referenceForModel } from '../../../module/k8s';
import { HrefLink, ResourceNSLink, ResourceClusterLink } from '../../nav/items';
// import { AuthAdminLink } from './items';
import { NavSection } from '../../nav/section';

// Wrap `NavItemSeparator` so we can use `required` without prop type errors.

const searchStartsWith = ['search'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const quotaStartsWith = ['resourcequotas', 'clusterresourcequotas'];

const HyperCloudNav = () => (
  <Translation>
    {t => (
      <>
        <NavSection title={t('COMMON:MSG_LNB_MENU_1')}>
          <HrefLink href="/dashboards" activePath="/dashboards/" name={t('COMMON:MSG_LNB_MENU_2')} />
          <HrefLink href="/search" name={t('COMMON:MSG_LNB_MENU_4')} startsWith={searchStartsWith} />
          <ResourceNSLink resource="audits" name={t('COMMON:MSG_LNB_MENU_5')} />
          <ResourceNSLink resource="events" name={t('COMMON:MSG_LNB_MENU_6')} />
          <HrefLink href="/grafana" name="Grafana" />
        </NavSection>
        <NavSection title="Operators" />
        <NavSection title={t('COMMON:MSG_LNB_MENU_10')}>
          <ResourceNSLink resource="servicebrokers" name="Service Broker" />
          <ResourceNSLink resource="serviceclasses" name="Service Class" />
          <ResourceNSLink resource="serviceplans" name="Service Plan" />
          <ResourceClusterLink resource="clusterservicebrokers" name="Cluster Service Broker" />
          <ResourceClusterLink resource="clusterserviceclasses" name="Cluster Service Class" />
          <ResourceClusterLink resource="clusterserviceplans" name="Cluster Service Plan" />
          <ResourceNSLink resource="serviceinstances" name="Service Instance" />
          <ResourceNSLink resource="servicebindings" name="Service Binding" />
          <ResourceNSLink resource="catalogserviceclaims" name="Catalog Service Claim" />
          <ResourceNSLink resource="templates" name="Template" />
          <ResourceClusterLink resource="clustertemplates" name="Cluster Template" />
          <ResourceNSLink resource="templateinstances" name="Template Instance" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_22')}>
          <ResourceNSLink resource="pods" name="Pods" />
          <ResourceNSLink resource="deployments" name="Deployments" />
          <ResourceNSLink resource="replicasets" name="Replica Sets" />
          <ResourceNSLink resource="horizontalpodautoscalers" name="Horizontal Pod Autoscalers" />
          <ResourceNSLink resource="daemonsets" name="Daemon Sets" />
          <ResourceNSLink resource="statefulsets" name="Stateful Sets" />
          <ResourceNSLink resource="virtualmachines" name="Virtual Machine" />
          <ResourceNSLink resource="virtualmachineinstances" name="Virtual Machine Instance" />
          <ResourceNSLink resource="configmaps" name="Config Maps" />
          <ResourceNSLink resource="secrets" name="Secrets" />
          <ResourceNSLink resource="jobs" name="Jobs" />
          <ResourceNSLink resource="cronjobs" name="Cron Jobs" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_35')}>
          <ResourceNSLink resource="virtualservices" name="Virtual Services" />
          <ResourceNSLink resource="destinationrules" name="Destination Rules" />
          <ResourceNSLink resource="envoyfilters" name="Envoy Filters" />
          <ResourceNSLink resource="gateways" name="Gateways" />
          <ResourceNSLink resource="sidecars" name="Sidecars" />
          <ResourceNSLink resource="serviceentries" name="Service Entries" />
          <ResourceNSLink resource="requestauthentications" name="Request Authentications" />
          <ResourceNSLink resource="peerauthentications" name="Peer Authentications" />
          <ResourceNSLink resource="authorizationpolicies" name="Authorization Policies" />
          <HrefLink href="/kiali" name="Kiali" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_46')}>
          <ResourceNSLink resource="services" name="Services" />
          <ResourceNSLink resource="ingresses" name="Ingresses" />
          <ResourceNSLink resource="networkpolicies" name="Network Policies" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_50')}>
          <ResourceClusterLink resource="storageclasses" name="Storage Classes" />
          <ResourceNSLink resource="datavolumes" name="Data Volumes" />
          <ResourceNSLink resource="persistentvolumeclaims" name="Persistent Volume Claims" />
          <ResourceClusterLink resource="persistentvolumes" name="Persistent Volumes" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_56')}>
          <ResourceNSLink resource="tasks" name={t('COMMON:MSG_LNB_MENU_57')} />
          <ResourceNSLink resource="clustertasks" name="Cluster Task" />
          <ResourceNSLink resource="taskruns" name={t('COMMON:MSG_LNB_MENU_58')} />
          <ResourceNSLink resource="pipelines" name={t('COMMON:MSG_LNB_MENU_59')} />
          <ResourceNSLink resource="pipelineruns" name={t('COMMON:MSG_LNB_MENU_60')} />
          <ResourceNSLink resource="approvals" name={t('COMMON:MSG_LNB_MENU_61')} />
          <ResourceNSLink resource="pipelineresources" name={t('COMMON:MSG_LNB_MENU_62')} />
          <ResourceNSLink resource="integrationjobs" name="IntegrationJob" />
          <ResourceNSLink resource="integrationconfigs" name="IntegrationConfig" />
        </NavSection>
        {/* <NavSection title="AI DevOps">
          <ResourceNSLink resource="notebooks" name='Notebook' />
          <ResourceNSLink resource="experiments" name='Experiment' />
          <ResourceNSLink resource="trainingjobs" name='TrainingJob' />
          <ResourceNSLink resource="inferenceservices" name='InferenceService' />
          <ResourceNSLink resource="workflowtemplates" name='WorkflowTemplate' />
          <ResourceNSLink resource="workflows" name='Workflow' />
        </NavSection> */}
        <NavSection title="Image">
          <ResourceNSLink resource="registries" name={t('COMMON:MSG_LNB_MENU_71')} />
          <ResourceClusterLink resource="imagesigners" name="Image Signer" />
          <ResourceNSLink resource="imagesignrequests" name="Image Sign Request" />
          <ResourceNSLink resource="imagescanrequests" name="Image Scan Request" />
          <ResourceNSLink resource="signerpolicies" name="Signer Policy" />
          {/* <ResourceNSLink resource="imagetransfers" name="Image Transfer" /> */}
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_79')}>
          <ResourceClusterLink resource="namespaces" name="Namespaces" />
          <ResourceClusterLink resource="namespaceclaims" name="Namespace Claims" />
          <ResourceNSLink resource="limitranges" name="Limit Ranges" />
          <ResourceNSLink resource="resourcequotas" name="Resource Quotas" startsWith={quotaStartsWith} />
          <ResourceNSLink resource="resourcequotaclaims" name="Resource Quota Claims" startsWith={quotaStartsWith} />
          <ResourceClusterLink resource="customresourcedefinitions" name="Custom Resource Definitions" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_72')}>
          <ResourceClusterLink resource="nodes" name="Nodes" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_73')}>
          <ResourceNSLink resource="roles" name="Roles" startsWith={rolesStartsWith} />
          <ResourceNSLink resource="rolebindings" name="Role Bindings" startsWith={rolebindingsStartsWith} />
          <ResourceNSLink resource="rolebindingclaims" name="Role Binding Claims" startsWith={rolebindingsStartsWith} />
          <ResourceNSLink resource="serviceaccounts" name="Service Accounts" />
          <ResourceClusterLink resource="podsecuritypolicies" name="PodSecurityPolicy" />
          {/* <AuthAdminLink resource={referenceForModel(UserModel)} name="Users" />
          <AuthAdminLink resource={referenceForModel(GroupModel)} name="User Groups" /> */}
        </NavSection>
      </>
    )}
  </Translation>
);

export default HyperCloudNav;
