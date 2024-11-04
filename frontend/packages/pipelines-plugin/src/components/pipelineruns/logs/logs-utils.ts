import { saveAs } from 'file-saver';
import i18next from 'i18next';
import { coFetchText } from '@console/internal/co-fetch';
import { errorModal } from '@console/internal/components/modals';
import {
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
  LineBuffer,
} from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import {
  PodKind,
  ContainerSpec,
  ContainerStatus,
  resourceURL,
  k8sGet,
} from '@console/internal/module/k8s';
import { TaskRunKind } from '../../../types';
import { containerToLogSourceStatus } from '../../../utils/pipeline-utils';
import { getTaskRunLog } from '../utils/tekton-results';

const getSortedContainerStatus = (
  containers: ContainerSpec[],
  containerStatuses: ContainerStatus[],
): ContainerStatus[] => {
  const containerNames = containers.map((c) => c.name);
  const sortedContainerStatus = [];
  containerStatuses.forEach((cs) => {
    const containerIndex = containerNames.indexOf(cs.name);
    sortedContainerStatus[containerIndex] = cs;
  });
  return sortedContainerStatus;
};

export const getRenderContainers = (
  pod: PodKind,
): { containers: ContainerSpec[]; stillFetching: boolean } => {
  const containers: ContainerSpec[] = pod?.spec?.containers ?? [];
  const containerStatuses: ContainerStatus[] = pod?.status?.containerStatuses ?? [];

  const sortedContainerStatuses = getSortedContainerStatus(containers, containerStatuses);

  const firstRunningCont = sortedContainerStatuses.findIndex(
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

const getOrderedStepsFromPod = (name: string, ns: string): Promise<ContainerStatus[]> => {
  return k8sGet(PodModel, name, ns)
    .then((pod: PodKind) => {
      return getSortedContainerStatus(
        pod.spec.containers ?? [],
        pod.status?.containerStatuses ?? [],
      );
    })
    .catch((err) => {
      errorModal({ error: err.message || i18next.t('pipelines-plugin~Error downloading logs.') });
      return [];
    });
};

type StepsWatchUrl = {
  [key: string]: {
    name: string;
    steps: { [step: string]: WatchURLStatus };
    taskRunPath: string;
  };
};

type WatchURLStatus = {
  status: string;
  url: string;
};

export const getDownloadAllLogsCallback = (
  sortedTaskRunNames: string[],
  taskRuns: TaskRunKind[],
  namespace: string,
  pipelineRunName: string,
): (() => Promise<Error>) => {
  const getWatchUrls = async (): Promise<StepsWatchUrl> => {
    const stepsList: ContainerStatus[][] = await Promise.all(
      sortedTaskRunNames.map((currTask) => {
        const { status } = taskRuns.find((t) => t.metadata.name === currTask) ?? {};
        return getOrderedStepsFromPod(status?.podName, namespace);
      }),
    );
    return sortedTaskRunNames.reduce((acc, currTask, i) => {
      const taskRun = taskRuns.find((t) => t.metadata.name === currTask);
      const pipelineTaskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
      const { status } = taskRun;
      const podName = status?.podName;
      const steps = stepsList[i];
      const allStepUrls = steps.reduce((stepUrls, currentStep) => {
        const { name } = currentStep;
        const currentStatus = containerToLogSourceStatus(currentStep);
        if (currentStatus === LOG_SOURCE_WAITING) return stepUrls;
        const urlOpts = {
          ns: namespace,
          name: podName,
          path: 'log',
          queryParams: {
            container: name,
            follow: 'true',
          },
        };
        return {
          ...stepUrls,
          [name]: {
            status: currentStatus,
            url: resourceURL(PodModel, urlOpts),
          } as WatchURLStatus,
        };
      }, {});
      acc[currTask] = {
        name: pipelineTaskName,
        steps: { ...allStepUrls },
        taskRunPath: taskRun.metadata?.annotations?.['results.tekton.dev/record'],
      };
      return acc;
    }, {});
  };

  const fetchLogs = async (tasksPromise: Promise<StepsWatchUrl>) => {
    const tasks = await tasksPromise;
    let allLogs = '';
    for (const currTask of sortedTaskRunNames) {
      const task = tasks[currTask];
      const steps = Object.keys(task.steps);
      allLogs += `${task.name}\n\n`;
      if (steps.length > 0) {
        for (const step of steps) {
          const { url, status } = task.steps[step];
          const getContentPromise = coFetchText(url).then((logs) => {
            return `${step.toUpperCase()}\n\n${logs}\n\n`;
          });
          allLogs +=
            status === LOG_SOURCE_TERMINATED
              ? // If we are done, we want this log content
                // eslint-disable-next-line no-await-in-loop
                await getContentPromise
              : // If we are not done, let's not wait indefinitely
                // eslint-disable-next-line no-await-in-loop
                await Promise.race([
                  getContentPromise,
                  new Promise<string>((resolve) => {
                    setTimeout(() => resolve(''), 1000);
                  }),
                ]);
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        allLogs += await getTaskRunLog(task.taskRunPath).then(
          (log) => `${tasks[currTask].name.toUpperCase()}\n\n${log}\n\n`,
        );
      }
    }
    const buffer = new LineBuffer(null);
    buffer.ingest(allLogs);
    const blob = buffer.getBlob({
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${pipelineRunName}.log`);
    return null;
  };
  return (): Promise<Error> => {
    return fetchLogs(getWatchUrls());
  };
};
