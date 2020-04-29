import { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';

export default (label: string) => `Hello ${label} Function!`;

export const testHandler: FeatureFlagHandler = function() {
  // eslint-disable-next-line no-console
  console.log('testHandler called', arguments);
};
