import type { WatchK8sResource } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const uniqueResource = <T extends WatchK8sResource & { prop: string }>(
  resource: T,
  prefix: string | number,
): T => ({
  ...resource,
  prop: `${prefix}-${resource.prop}`,
});
