import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk';

export const testHandler = (callback: SetFeatureFlag) => {
  // eslint-disable-next-line no-console
  console.log('testHandler called', callback);
};
