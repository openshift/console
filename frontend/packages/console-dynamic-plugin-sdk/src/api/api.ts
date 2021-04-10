import { UseK8sWatchResource, UseK8sWatchResources } from './api-types';

export * from './api-types';

const MockImpl = () => {
  throw new Error('You need to configure webpack externals to use this function at runtime.');
};

export const useK8sWatchResource: UseK8sWatchResource = MockImpl;
export const useK8sWatchResources: UseK8sWatchResources = MockImpl;
