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
          <ResourceNSLink resource="events" name={t('COMMON:MSG_LNB_MENU_6')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_22')}>
          <ResourceNSLink resource="pods" name={t('COMMON:MSG_LNB_MENU_23')} />
          <ResourceNSLink resource="deployments" name={t('COMMON:MSG_LNB_MENU_24')} />
          <ResourceNSLink resource="replicasets" name={t('COMMON:MSG_LNB_MENU_31')} />
          <ResourceNSLink resource="horizontalpodautoscalers" name={t('COMMON:MSG_LNB_MENU_32')} />
          <ResourceNSLink resource="daemonsets" name={t('COMMON:MSG_LNB_MENU_30')} />
          <ResourceNSLink resource="statefulsets" name={t('COMMON:MSG_LNB_MENU_25')} />
          <ResourceNSLink resource="configmaps" name={t('COMMON:MSG_LNB_MENU_27')} />
          <ResourceNSLink resource="secrets" name={t('COMMON:MSG_LNB_MENU_26')} />
          <ResourceNSLink resource="jobs" name={t('COMMON:MSG_LNB_MENU_29')} />
          <ResourceNSLink resource="cronjobs" name={t('COMMON:MSG_LNB_MENU_28')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_46')}>
          <ResourceNSLink resource="services" name={t('COMMON:MSG_LNB_MENU_47')} />
          <ResourceNSLink resource="ingresses" name={t('COMMON:MSG_LNB_MENU_48')} />
          <ResourceNSLink resource="networkpolicies" name={t('COMMON:MSG_LNB_MENU_49')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_50')}>
          <ResourceClusterLink resource="storageclasses" name={t('COMMON:MSG_LNB_MENU_53')} />
          <ResourceNSLink resource="persistentvolumeclaims" name={t('COMMON:MSG_LNB_MENU_52')} />
          <ResourceClusterLink resource="persistentvolumes" name={t('COMMON:MSG_LNB_MENU_51')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_79')}>
          <ResourceClusterLink resource="namespaces" name={t('COMMON:MSG_LNB_MENU_3')} />
          <ResourceNSLink resource="limitranges" name={t('COMMON:MSG_LNB_MENU_81')} />
          <ResourceNSLink resource="resourcequotas" name={t('COMMON:MSG_LNB_MENU_80')} startsWith={quotaStartsWith} />
          <ResourceClusterLink resource="customresourcedefinitions" name={t('COMMON:MSG_LNB_MENU_82')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_72')}>
          <ResourceClusterLink resource="nodes" name={t('COMMON:MSG_LNB_MENU_100')} />
        </NavSection>
        <NavSection title={t('COMMON:MSG_LNB_MENU_73')}>
          <ResourceNSLink resource="roles" name={t('COMMON:MSG_LNB_MENU_75')} startsWith={rolesStartsWith} />
          <ResourceNSLink resource="rolebindings" name={t('COMMON:MSG_LNB_MENU_76')} startsWith={rolebindingsStartsWith} />
          <ResourceNSLink resource="serviceaccounts" name={t('COMMON:MSG_LNB_MENU_74')} />
          <ResourceClusterLink resource="podsecuritypolicies" name={t('COMMON:MSG_LNB_MENU_78')} />
        </NavSection>
      </>
    )}
  </Translation>
);

export default HyperCloudNav;
