import { PIPELINE_RUN_AUTO_START_FAILED } from '../const';

export const getAllNotStartedPipelines = (): { [ns: string]: string[] } => {
  try {
    return JSON.parse(sessionStorage.getItem(PIPELINE_RUN_AUTO_START_FAILED) ?? '{}');
  } catch (e) {
    return {};
  }
};

export const getNotStartedPipelines = (namespace: string): string[] => {
  return getAllNotStartedPipelines()[namespace] ?? [];
};
export const isPipelineNotStarted = (pipelineName: string, namespace: string): boolean => {
  return getNotStartedPipelines(namespace).includes(pipelineName);
};

export const removePipelineNotStarted = (pipelineName: string, namespace: string): void => {
  if (!pipelineName || !namespace) return;

  const newList = getNotStartedPipelines(namespace).filter((pName) => pName !== pipelineName);

  sessionStorage.setItem(
    PIPELINE_RUN_AUTO_START_FAILED,
    JSON.stringify({ ...getAllNotStartedPipelines(), [namespace]: newList }),
  );
};

export const setPipelineNotStarted = (pipelineName: string, namespace: string): void => {
  if (!pipelineName || !namespace) return;
  const pipelineData = getAllNotStartedPipelines();

  if (!pipelineData[namespace]) {
    pipelineData[namespace] = [];
  }
  if (!pipelineData[namespace].includes(pipelineName)) {
    pipelineData[namespace].push(pipelineName);
    sessionStorage.setItem(PIPELINE_RUN_AUTO_START_FAILED, JSON.stringify(pipelineData));
  }
};
