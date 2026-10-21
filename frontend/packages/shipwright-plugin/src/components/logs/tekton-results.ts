import * as _ from 'lodash';
import type { PipelineRunKind } from '@console/dev-console/src/types/pipeline';
import type {
  K8sResourceCommon,
  MatchExpression,
  MatchLabels,
  Selector,
} from '@console/dynamic-plugin-sdk/src';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import type { TaskRunKind } from '../../types';

// REST API spec
// https://github.com/tektoncd/results/blob/main/docs/api/rest-api-spec.md

// const URL_PREFIX = `/apis/results.tekton.dev/v1alpha2/parents/`;

export type DevConsoleEndpointResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};

const DELETED_RESOURCE_IN_K8S_ANNOTATION = 'resource.deleted.in.k8s';
const RESOURCE_LOADED_FROM_RESULTS_ANNOTATION = 'resource.loaded.from.tektonResults';

const MINIMUM_PAGE_SIZE = 5;
const MAXIMUM_PAGE_SIZE = 10000;

export type ResultRecord = {
  name: string;
  uid: string;
  createTime: string;
  updateTime: string;
  etag: string;
  data: {
    // tekton.dev/v1beta1.PipelineRun | tekton.dev/v1beta1.TaskRun | results.tekton.dev/v1alpha2.Log
    type: string;
    value: string;
  };
};

export type Log = {
  result: {
    name: string;
    data: string;
  };
};

type TRRequest = {
  searchNamespace: string;
  searchParams: string;
};

type TaskRunLogRequest = {
  taskRunPath: string;
};

export type RecordsList = {
  nextPageToken?: string;
  records: ResultRecord[];
};

export type TektonResultsOptions = {
  pageSize?: number;
  selector?: Selector;
  // limit cannot be used in conjuction with pageSize and takes precedence
  limit?: number;
  filter?: string;
};

const throw404 = () => {
  // eslint-disable-next-line no-throw-literal
  throw { code: 404 };
};

// decoding result base64
export const decodeValue = (value: string) => atob(value);
export const decodeValueJson = (value: string) => {
  const decodedValue = value ? JSON.parse(decodeValue(value)) : null;
  let resourceDeletedInK8sAnnotation;
  if (_.has(decodedValue?.metadata, 'deletionTimestamp')) {
    delete decodedValue?.metadata?.deletionTimestamp;
    resourceDeletedInK8sAnnotation = { [DELETED_RESOURCE_IN_K8S_ANNOTATION]: 'true' };
  }
  const decodedValueWithTRAnnotation = decodedValue
    ? {
        ...decodedValue,
        metadata: {
          ...decodedValue?.metadata,
          annotations: {
            ...decodedValue?.metadata?.annotations,
            [RESOURCE_LOADED_FROM_RESULTS_ANNOTATION]: 'true',
            ...resourceDeletedInK8sAnnotation,
          },
        },
      }
    : null;
  return decodedValueWithTRAnnotation;
};

// filter functions
export const AND = (...expressions: string[]) => expressions.filter((x) => x).join(' && ');
export const OR = (...expressions: string[]) => {
  const filteredExpressions = expressions.filter((x) => x);
  const filter = filteredExpressions.join(' || ');
  return filteredExpressions.length > 1 ? `(${filter})` : filter;
};

const EXP = (left: string, right: string, operator: string) => `${left} ${operator} ${right}`;
export const EQ = (left: string, right: string) => EXP(left, `"${right}"`, '==');
export const NEQ = (left: string, right: string) => EXP(left, `"${right}"`, '!=');

export enum DataType {
  PipelineRunV1Beta1 = 'tekton.dev/v1beta1.PipelineRun',
  TaskRunV1Beta1 = 'tekton.dev/v1beta1.TaskRun',
  PipelineRunV1 = 'tekton.dev/v1.PipelineRun',
  TaskRunV1 = 'tekton.dev/v1.TaskRun',
}

export const labelsToFilter = (labels?: MatchLabels): string =>
  labels
    ? AND(
        ...Object.keys(labels).map((label) =>
          EQ(`data.metadata.labels["${label}"]`, labels[label]),
        ),
      )
    : '';

export const nameFilter = (name?: string): string =>
  name ? AND(`data.metadata.name.startsWith("${name.trim().toLowerCase()}")`) : '';

export const expressionsToFilter = (expressions: Omit<MatchExpression, 'value'>[]): string =>
  AND(
    ...expressions
      .map((expression) => {
        switch (expression.operator) {
          case 'Exists':
            return `data.metadata.labels.contains("${expression.key}")`;
          case 'DoesNotExist':
            return `!data.metadata.labels.contains("${expression.key}")`;
          case 'NotIn':
            return expression.values?.length > 0
              ? AND(
                  ...expression.values.map((value) =>
                    NEQ(`data.metadata.labels["${expression.key}"]`, value),
                  ),
                )
              : '';
          case 'In':
            return expression.values?.length > 0
              ? `data.metadata.labels["${expression.key}"] in [${expression.values.map(
                  (value) => `"${value}"`,
                )}]`
              : '';
          case 'Equals':
            return expression.values?.[0]
              ? EQ(`data.metadata.labels["${expression.key}"]`, expression.values?.[0])
              : '';
          case 'NotEquals':
          case 'NotEqual':
            return expression.values?.[0]
              ? NEQ(`data.metadata.labels["${expression.key}"]`, expression.values?.[0])
              : '';
          case 'GreaterThan':
            return expression.values?.[0]
              ? EXP(`data.metadata.labels["${expression.key}"]`, expression.values?.[0], '>')
              : '';
          case 'LessThan':
            return expression.values?.[0]
              ? EXP(`data.metadata.labels["${expression.key}"]`, expression.values?.[0], '<')
              : '';
          default:
            throw new Error(
              `Tekton results operator '${expression.operator}' conversion not implemented.`,
            );
        }
      })
      .filter((x) => x),
  );

export const selectorToFilter = (selector) => {
  let filter = '';
  if (selector) {
    const { matchLabels, matchExpressions, filterByName } = selector;
    if (filterByName) {
      filter = AND(filter, nameFilter(filterByName as string));
    }
    if (matchLabels || matchExpressions) {
      if (matchLabels) {
        filter = AND(filter, labelsToFilter(matchLabels));
      }
      if (matchExpressions) {
        filter = AND(filter, expressionsToFilter(matchExpressions));
      }
    } else {
      filter = labelsToFilter(selector as MatchLabels);
    }
  }
  return filter;
};

// Devs should be careful to not cache a response that may not be complete.
// In most situtations, caching is unnecessary.
// Only cache a response that returns a single complete record as lists can change over time.
let CACHE: { [key: string]: [any[], RecordsList] } = {};
export const clearCache = () => {
  CACHE = {};
};
const InFlightStore: { [key: string]: boolean } = {};

export const fetchTektonResultsURLConfig = async (
  namespace: string,
  dataType?: DataType,
  filter?: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
): Promise<TRRequest> => {
  const searchNamespace = namespace && namespace !== ALL_NAMESPACES_KEY ? namespace : '-';
  const searchParams = `${new URLSearchParams({
    // default sort should always be by `create_time desc`
    // order_by: 'create_time desc', not supported yet
    page_size: `${Math.max(
      MINIMUM_PAGE_SIZE,
      Math.min(MAXIMUM_PAGE_SIZE, options?.limit >= 0 ? options.limit : options?.pageSize ?? 50),
    )}`,
    ...(nextPageToken ? { page_token: nextPageToken } : {}),
    filter: AND(
      EQ('data_type', dataType.toString()),
      filter,
      selectorToFilter(options?.selector),
      options?.filter,
    ),
  }).toString()}`;
  return { searchNamespace, searchParams };
};

/**
 * Fetches the Tekton results from the Tekton Results API.
 */
const fetchTektonResults = async (tRRequest: TRRequest): Promise<RecordsList> => {
  const TEKTON_RESULTS_FETCH_URL = '/api/dev-console/tekton-results/get';
  const resultListResponse: DevConsoleEndpointResponse = await consoleFetchJSON.post(
    TEKTON_RESULTS_FETCH_URL,
    tRRequest,
  );

  if (!resultListResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (resultListResponse.statusCode < 200 || resultListResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${resultListResponse.statusCode}`,
      resultListResponse.statusCode,
      null,
      resultListResponse,
    );
  }
  try {
    return JSON.parse(resultListResponse.body) as RecordsList;
  } catch (e) {
    throw new Error('Failed to parse task details response body as JSON');
  }
};

export const getFilteredRecord = async <R extends K8sResourceCommon>(
  namespace: string,
  dataType: DataType,
  filter?: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
): Promise<[R[], RecordsList, boolean?]> => {
  if (cacheKey) {
    const result = CACHE[cacheKey];
    if (result) {
      return result;
    }
    if (InFlightStore[cacheKey]) {
      return [
        [],
        {
          nextPageToken: null,
          records: [],
        },
        true,
      ];
    }
  }
  InFlightStore[cacheKey] = true;
  const value = await (async (): Promise<[R[], RecordsList]> => {
    try {
      const { searchNamespace, searchParams } = await fetchTektonResultsURLConfig(
        namespace,
        dataType,
        filter,
        options,
        nextPageToken,
      );

      let list: RecordsList = await fetchTektonResults({
        searchNamespace,
        searchParams,
      });
      if (options?.limit >= 0) {
        list = {
          nextPageToken: null,
          records: list.records.slice(0, options.limit),
        };
      }
      return [list.records.map((result) => decodeValueJson(result.data.value)), list];
    } catch (e) {
      // return an empty response if we get a 404 error
      if (e?.code === 404) {
        return [
          [],
          {
            nextPageToken: null,
            records: [],
          },
        ] as [R[], RecordsList];
      }
      throw e;
    }
  })();

  if (cacheKey) {
    InFlightStore[cacheKey] = false;
    CACHE[cacheKey] = value;
  }
  return value;
};

const getFilteredPipelineRuns = (
  namespace: string,
  filter: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
  IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER?: boolean,
) =>
  getFilteredRecord<PipelineRunKind>(
    namespace,
    IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER
      ? DataType.PipelineRunV1
      : DataType.PipelineRunV1Beta1,
    filter,
    options,
    nextPageToken,
    cacheKey,
  );

const getFilteredTaskRuns = (
  namespace: string,
  filter: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
  IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER?: boolean,
) =>
  getFilteredRecord<TaskRunKind>(
    namespace,
    IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER ? DataType.TaskRunV1 : DataType.TaskRunV1Beta1,
    filter,
    options,
    nextPageToken,
    cacheKey,
  );

export const getPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  // supply a cacheKey only if the PipelineRun is complete and response will never change in the future
  cacheKey?: string,
  IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER?: boolean,
) =>
  getFilteredPipelineRuns(
    namespace,
    '',
    options,
    nextPageToken,
    cacheKey,
    IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER,
  );

export const getTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  // supply a cacheKey only if the TaskRun is complete and response will never change in the future
  cacheKey?: string,
  IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER?: boolean,
) =>
  getFilteredTaskRuns(
    namespace,
    '',
    options,
    nextPageToken,
    cacheKey,
    IS_PIPELINE_OPERATOR_VERSION_1_16_OR_NEWER,
  );

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
