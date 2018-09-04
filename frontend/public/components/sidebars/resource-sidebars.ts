import { NetworkPolicySidebar } from './network-policy-sidebar';
import { RoleSidebar } from './role-sidebar';
import { BuildConfigSidebar } from './build-config-sidebar';
import { ResourceQuotaSidebar } from './resource-quota-sidebar';

export const resourceSidebars = new Map<string, React.ComponentType<any>>()
  .set('BuildConfig', BuildConfigSidebar)
  .set('ClusterRole', RoleSidebar)
  .set('NetworkPolicy', NetworkPolicySidebar)
  .set('ResourceQuota', ResourceQuotaSidebar)
  .set('Role', RoleSidebar);
