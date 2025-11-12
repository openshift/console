import type { FirehoseResource } from '../../../utils/types';

export const uniqueResource = (
  resource: FirehoseResource,
  prefix: string | number,
): FirehoseResource => ({
  ...resource,
  prop: `${prefix}-${resource.prop}`,
});
