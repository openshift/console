import { PodKind, ContainerSpec, ContainerStatus } from '@console/internal/module/k8s';
import { containerToLogSourceStatus } from '../../../utils/pipeline-utils';
import { LOG_SOURCE_TERMINATED } from '@console/internal/components/utils';

export const getRenderContainers = (
  pod: PodKind,
): { containers: ContainerSpec[]; stillFetching: boolean } => {
  const containers: ContainerSpec[] = pod.spec?.containers ?? [];
  const containerStatus: ContainerStatus[] = pod.status?.containerStatuses ?? [];

  const containerNames = containers.map((c) => c.name);
  const sortedContainerStatus = [];
  containerStatus.forEach((cs) => {
    const containerIndex = containerNames.indexOf(cs.name);
    sortedContainerStatus[containerIndex] = cs;
  });

  const firstRunningCont = sortedContainerStatus.findIndex(
    (container) => containerToLogSourceStatus(container) !== LOG_SOURCE_TERMINATED,
  );
  return {
    containers: containers.slice(
      0,
      firstRunningCont === -1 ? containers.length : firstRunningCont + 1,
    ),
    stillFetching: firstRunningCont !== -1,
  };
};
