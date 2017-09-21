import { NetworkPolicySidebar } from './network-policy-sidebar';
import { RoleSidebar } from './role-sidebar';

export const resourceSidebars = new Map<string, React.ComponentType<any>>()
  .set('NetworkPolicy', NetworkPolicySidebar)
  .set('Role', RoleSidebar)
  .set('ClusterRole', RoleSidebar);
