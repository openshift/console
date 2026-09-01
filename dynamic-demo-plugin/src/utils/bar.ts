import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk';

export const testHandler = (callback: SetFeatureFlag) => {
  console.log('testHandler called', callback);
};
