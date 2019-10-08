import { FirehoseResource } from '../../../utils';

export const uniqueResource = (
  resource: FirehoseResource,
  prefix: string | number,
): FirehoseResource => ({
  ...resource,
  prop: `${prefix}-${resource.prop}`,
});
