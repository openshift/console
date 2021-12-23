import { TektonHubTask } from '../../types/tektonHub';

export const getClusterPlatform = (): string =>
  `${window.SERVER_FLAGS.GOOS}/${window.SERVER_FLAGS.GOARCH}`;

export const filterBySupportedPlatforms = (task: TektonHubTask): boolean => {
  const supportedPlatforms = task?.platforms.map((p) => p.name) ?? [];
  return supportedPlatforms.includes(getClusterPlatform());
};
