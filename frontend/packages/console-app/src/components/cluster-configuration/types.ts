import {
  ResolvedExtension,
  ClusterConfigurationGroup,
  ClusterConfigurationItem,
} from '@console/dynamic-plugin-sdk/src';

export {
  ClusterConfigurationGroup,
  ClusterConfigurationItem,
} from '@console/dynamic-plugin-sdk/src';

export type ResolvedClusterConfigurationGroup = Omit<
  ResolvedExtension<ClusterConfigurationGroup>['properties'],
  'insertBefore' | 'insertAfter'
>;

export type ResolvedClusterConfigurationItem = Omit<
  ResolvedExtension<ClusterConfigurationItem>['properties'],
  'insertBefore' | 'insertAfter' | 'readAccessReview' | 'writeAccessReview'
> & { readonly: boolean };
