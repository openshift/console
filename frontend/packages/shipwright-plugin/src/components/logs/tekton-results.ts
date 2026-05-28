import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';

// REST API spec
// https://github.com/tektoncd/results/blob/main/docs/api/rest-api-spec.md

// const URL_PREFIX = `/apis/results.tekton.dev/v1alpha2/parents/`;

type DevConsoleEndpointResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};

type TaskRunLogRequest = {
  taskRunPath: string;
};

const throw404 = () => {
  // eslint-disable-next-line no-throw-literal
  throw { code: 404 };
};

const isJSONString = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * Fetches the task run logs from the Tekton Results API.
 */
const fetchTaskRunLogs = async <T>(taskRunLogRequest: TaskRunLogRequest): Promise<T | string> => {
  const TEKTON_RESULTS_TASKRUN_LOGS_URL = '/api/dev-console/tekton-results/logs';
  const taskRunLogResponse: DevConsoleEndpointResponse = await consoleFetchJSON.post(
    TEKTON_RESULTS_TASKRUN_LOGS_URL,
    taskRunLogRequest,
  );

  if (!taskRunLogResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (taskRunLogResponse.statusCode < 200 || taskRunLogResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${taskRunLogResponse.statusCode}`,
      taskRunLogResponse.statusCode,
      null,
      taskRunLogResponse,
    );
  }
  return isJSONString(taskRunLogResponse.body)
    ? JSON.parse(taskRunLogResponse.body)
    : taskRunLogResponse.body;
};

export const getTaskRunLog = async (taskRunPath: string): Promise<string> => {
  if (!taskRunPath) {
    throw404();
  }
  return fetchTaskRunLogs({
    taskRunPath: taskRunPath.replace('/records/', '/logs/'),
  });
};
