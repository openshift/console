import * as React from 'react';

import { Translation } from 'react-i18next';
// import { GroupModel, UserModel } from '../../../models';

// import { referenceForModel } from '../../../module/k8s';
import { HrefLink, ResourceNSLink, ResourceClusterLink, NewTabLink } from '../../nav/items';
// import { AuthAdminLink } from './items';
import { NavSection } from '../../nav/section';

// Wrap `NavItemSeparator` so we can use `required` without prop type errors.

const searchStartsWith = ['search'];
const rolesStartsWith = ['roles', 'clusterroles'];
const rolebindingsStartsWith = ['rolebindings', 'clusterrolebindings'];
const quotaStartsWith = ['resourcequotas', 'clusterresourcequotas'];

const MasterNav = () => (
  <Translation>
    {t => (
      <>
        <NavSection title={t('COMMON:MSG_LNB_MENU_1')}>
          <HrefLink href="/dashboards" activePath="/dashboards/" name={t('COMMON:MSG_LNB_MENU_90')} />
          <HrefLink href="/search" name={t('COMMON:MSG_LNB_MENU_4')} startsWith={searchStartsWith} />
          <ResourceNSLink resource="audits" name={t('COMMON:MSG_LNB_MENU_5')} />
          <ResourceNSLink resource="events" name={t('COMMON:MSG_LNB_MENU_6')} />
          {/* <HrefLink href="/grafana" name="Grafana" />
          <HrefLink href="/kibana" name="Kibana" /> */}
          <NewTabLink name={t('COMMON:MSG_LNB_MENU_98')} type="grafana" />
          <NewTabLink name={t('COMMON:MSG_LNB_MENU_99')} type="kibana" />
        </NavSection>
        <NavSection title="Operators" />
        <NavSection title={t('COMMON:MSG_LNB_MENU_10')}>
          <ResourceNSLink resource="servicebrokers" name={t('COMMON:MSG_LNB_MENU_11')} />
          <ResourceNSLink resource="serviceclasses" name={t('COMMON:MSG_LNB_MENU_12')} />
          {/* <ResourceNSLink resource="serviceplans" name="Service Plan" /> */}
          <ResourceClusterLink resource="clusterservicebrokers" name={t('COMMON:MSG_LNB_MENU_14')} />
          <ResourceClusterLink resource="clusterserviceclasses" name={t('COMMON:MSG_LNB_MENU_15')} />
          {/* <ResourceClusterLink resource="clusterserviceplans" name="Cluster Service Plan" /> */}
          <ResourceNSLink resource="serviceinstances" name={t('COMMON:MSG_LNB_MENU_17')} />
          <ResourceNSLink resource="servicebindings" name={t('COMMON:MSG_LNB_MENU_18')} />
          <ResourceNSLink resource="catalogserviceclaims" name={t('COMMON:MSG_LNB_MENU_19')} />
          <ResourceNSLink resource="templates" name={t('COMMON:MSG_LNB_MENU_20')} />
          <ResourceClusterLink resource="clustertemplates" name={t('COMMON:MSG_LNB_MENU_104')} />
          <ResourceNSLink resource="templateinstances" name={t('COMMON:MSG_LNB_MENU_21')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_22')}>
          <ResourceNSLink resource="pods" name={t('COMMON:MSG_LNB_MENU_23')} />
          <ResourceNSLink resource="deployments" name={t('COMMON:MSG_LNB_MENU_24')} />
          <ResourceNSLink resource="replicasets" name={t('COMMON:MSG_LNB_MENU_31')} />
          <ResourceNSLink resource="horizontalpodautoscalers" name={t('COMMON:MSG_LNB_MENU_32')} />
          <ResourceNSLink resource="daemonsets" name={t('COMMON:MSG_LNB_MENU_30')} />
          <ResourceNSLink resource="statefulsets" name={t('COMMON:MSG_LNB_MENU_25')} />
          {/* <ResourceNSLink resource="virtualmachines" name={t('COMMON:MSG_LNB_MENU_33')} />
          <ResourceNSLink resource="virtualmachineinstances" name={t('COMMON:MSG_LNB_MENU_34')} /> */}
          <ResourceNSLink resource="configmaps" name={t('COMMON:MSG_LNB_MENU_27')} />
          <ResourceNSLink resource="secrets" name={t('COMMON:MSG_LNB_MENU_26')} />
          <ResourceNSLink resource="jobs" name={t('COMMON:MSG_LNB_MENU_29')} />
          <ResourceNSLink resource="cronjobs" name={t('COMMON:MSG_LNB_MENU_28')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_35')}>
          <ResourceNSLink resource="virtualservices" name={t('COMMON:MSG_LNB_MENU_36')} />
          <ResourceNSLink resource="destinationrules" name={t('COMMON:MSG_LNB_MENU_37')} />
          <ResourceNSLink resource="envoyfilters" name={t('COMMON:MSG_LNB_MENU_38')} />
          <ResourceNSLink resource="gateways" name={t('COMMON:MSG_LNB_MENU_39')} />
          <ResourceNSLink resource="sidecars" name={t('COMMON:MSG_LNB_MENU_40')} />
          <ResourceNSLink resource="serviceentries" name={t('COMMON:MSG_LNB_MENU_41')} />
          <ResourceNSLink resource="requestauthentications" name={t('COMMON:MSG_LNB_MENU_42')} />
          <ResourceNSLink resource="peerauthentications" name={t('COMMON:MSG_LNB_MENU_43')} />
          <ResourceNSLink resource="authorizationpolicies" name={t('COMMON:MSG_LNB_MENU_44')} />
          {/* <HrefLink href="/kiali" name={t('COMMON:MSG_LNB_MENU_45')} /> */}
          <NewTabLink name={t('COMMON:MSG_LNB_MENU_45')} type="kiali" />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_46')}>
          <ResourceNSLink resource="services" name={t('COMMON:MSG_LNB_MENU_47')} />
          <ResourceNSLink resource="ingresses" name={t('COMMON:MSG_LNB_MENU_48')} />
          <ResourceNSLink resource="networkpolicies" name={t('COMMON:MSG_LNB_MENU_49')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_50')}>
          <ResourceClusterLink resource="storageclasses" name={t('COMMON:MSG_LNB_MENU_53')} />
          {/* <ResourceNSLink resource="datavolumes" name={t('COMMON:MSG_LNB_MENU_54')} /> */}
          <ResourceNSLink resource="persistentvolumeclaims" name={t('COMMON:MSG_LNB_MENU_52')} />
          <ResourceClusterLink resource="persistentvolumes" name={t('COMMON:MSG_LNB_MENU_51')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_56')}>
          <ResourceNSLink resource="tasks" name={t('COMMON:MSG_LNB_MENU_57')} />
          <ResourceClusterLink resource="clustertasks" name={t('COMMON:MSG_LNB_MENU_94')} />
          <ResourceNSLink resource="taskruns" name={t('COMMON:MSG_LNB_MENU_58')} />
          <ResourceNSLink resource="pipelines" name={t('COMMON:MSG_LNB_MENU_59')} />
          <ResourceNSLink resource="pipelineruns" name={t('COMMON:MSG_LNB_MENU_60')} />
          <ResourceNSLink resource="approvals" name={t('COMMON:MSG_LNB_MENU_61')} />
          <ResourceNSLink resource="pipelineresources" name={t('COMMON:MSG_LNB_MENU_62')} />
          <ResourceNSLink resource="integrationjobs" name={t('COMMON:MSG_LNB_MENU_185')} />
          <ResourceNSLink resource="integrationconfigs" name={t('COMMON:MSG_LNB_MENU_183')} />
        </NavSection>
        {/* <NavSection title="AI DevOps">
          <ResourceNSLink resource="notebooks" name='Notebook' />
          <ResourceNSLink resource="experiments" name='Experiment' />
          <ResourceNSLink resource="trainingjobs" name='TrainingJob' />
          <ResourceNSLink resource="inferenceservices" name='InferenceService' />
          <ResourceNSLink resource="workflowtemplates" name='WorkflowTemplate' />
          <ResourceNSLink resource="workflows" name='Workflow' />
        </NavSection> */}
        <NavSection title={t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_3')}>
          <ResourceNSLink resource="registries" name={t('COMMON:MSG_LNB_MENU_187')} />
          <ResourceNSLink resource="externalregistries" name={t('COMMON:MSG_LNB_MENU_189')} />
          <ResourceClusterLink resource="imagesigners" name={t('COMMON:MSG_LNB_MENU_91')} />
          <ResourceNSLink resource="imagesignrequests" name={t('COMMON:MSG_LNB_MENU_92')} />
          <ResourceNSLink resource="imagescanrequests" name={t('COMMON:MSG_LNB_MENU_95')} />
          <ResourceNSLink resource="signerpolicies" name={t('COMMON:MSG_LNB_MENU_96')} />
          {/* <ResourceNSLink resource="imagetransfers" name="Image Transfer" /> */}
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_79')}>
          <ResourceClusterLink resource="namespaces" name={t('COMMON:MSG_LNB_MENU_3')} />
          <ResourceClusterLink resource="namespaceclaims" name={t('COMMON:MSG_LNB_MENU_103')} />
          <ResourceNSLink resource="limitranges" name={t('COMMON:MSG_LNB_MENU_81')} />
          <ResourceNSLink resource="resourcequotas" name={t('COMMON:MSG_LNB_MENU_80')} startsWith={quotaStartsWith} />
          <ResourceNSLink resource="resourcequotaclaims" name={t('COMMON:MSG_LNB_MENU_102')} startsWith={quotaStartsWith} />
          <ResourceClusterLink resource="customresourcedefinitions" name={t('COMMON:MSG_LNB_MENU_82')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_72')}>
          <ResourceClusterLink resource="nodes" name={t('COMMON:MSG_LNB_MENU_100')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_73')}>
          <ResourceNSLink resource="roles" name={t('COMMON:MSG_LNB_MENU_75')} startsWith={rolesStartsWith} />
          <ResourceNSLink resource="rolebindings" name={t('COMMON:MSG_LNB_MENU_76')} startsWith={rolebindingsStartsWith} />
          <ResourceNSLink resource="rolebindingclaims" name={t('COMMON:MSG_LNB_MENU_101')} startsWith={rolebindingsStartsWith} />
          <ResourceNSLink resource="serviceaccounts" name={t('COMMON:MSG_LNB_MENU_74')} />
          <ResourceClusterLink resource="podsecuritypolicies" name={t('COMMON:MSG_LNB_MENU_78')} />
          {/* <AuthAdminLink resource={referenceForModel(UserModel)} name="Users" />
          <AuthAdminLink resource={referenceForModel(GroupModel)} name="User Groups" /> */}
        </NavSection>
      </>
    )}
  </Translation>
);

export default MasterNav;
