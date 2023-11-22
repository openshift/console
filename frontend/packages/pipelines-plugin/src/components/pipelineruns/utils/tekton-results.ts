import * as _ from 'lodash';
import {
  K8sResourceCommon,
  MatchExpression,
  MatchLabels,
  Selector,
} from '@console/dynamic-plugin-sdk/src';
import { RouteModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import { consoleProxyFetchJSON } from '@console/shared/src/utils/proxy';
import { TektonResultModel } from '../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../types';

// REST API spec
// https://github.com/tektoncd/results/blob/main/docs/api/rest-api-spec.md

// const URL_PREFIX = `/apis/results.tekton.dev/v1alpha2/parents/`;

const MINIMUM_PAGE_SIZE = 5;
const MAXIMUM_PAGE_SIZE = 10000;

export type Record = {
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

export type RecordsList = {
  nextPageToken?: string;
  records: Record[];
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
    resourceDeletedInK8sAnnotation = { 'resource.deleted.in.k8s': 'true' };
  }
  const decodedValueWithTRAnnotation = decodedValue
    ? {
        ...decodedValue,
        metadata: {
          ...decodedValue?.metadata,
          annotations: {
            ...decodedValue?.metadata?.annotations,
            'resource.loaded.from.tektonResults': 'true',
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
  PipelineRun = 'tekton.dev/v1beta1.PipelineRun',
  TaskRun = 'tekton.dev/v1beta1.TaskRun',
  Log = 'results.tekton.dev/v1alpha2.Log',
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

// const getTRUrlPrefix = (): string => URL_PREFIX;

export const getTRURLHost = async () => {
  const tektonResult = await k8sGet(TektonResultModel, 'result');
  const targetNamespace = tektonResult?.spec?.targetNamespace;
  const route = await k8sGet(RouteModel, 'tekton-results-api-service', targetNamespace);
  return route?.spec.host;
};

export const createTektonResultsUrl = async (
  namespace: string,
  dataType?: DataType,
  filter?: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
): Promise<string> => {
  const tektonResultUrl = await getTRURLHost();
  if (!tektonResultUrl) {
    throw new Error('route.spec.host is undefined');
  }
  const url = `https://${tektonResultUrl}/apis/results.tekton.dev/v1alpha2/parents/${namespace}/results/-/records?${new URLSearchParams(
    {
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
    },
  ).toString()}`;
  return url;
};

export const getFilteredRecord = async <R extends K8sResourceCommon>(
  namespace: string,
  dataType: DataType,
  filter?: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
): Promise<[R[], RecordsList, boolean?]> => {
  const url = await createTektonResultsUrl(namespace, dataType, filter, options, nextPageToken);

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
      let list: RecordsList = await consoleProxyFetchJSON({
        url,
        method: 'GET',
        allowInsecure: true,
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
) =>
  getFilteredRecord<PipelineRunKind>(
    namespace,
    DataType.PipelineRun,
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
) =>
  getFilteredRecord<TaskRunKind>(
    namespace,
    DataType.TaskRun,
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
) => getFilteredPipelineRuns(namespace, '', options, nextPageToken, cacheKey);

export const getTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  // supply a cacheKey only if the TaskRun is complete and response will never change in the future
  cacheKey?: string,
) => getFilteredTaskRuns(namespace, '', options, nextPageToken, cacheKey);

const getLog = async (taskRunPath: string) => {
  const tektonResultUrl = await getTRURLHost();
  const url = `https://${tektonResultUrl}/apis/results.tekton.dev/v1alpha2/parents/${taskRunPath.replace(
    '/records/',
    '/logs/',
  )}`;
  return consoleProxyFetchJSON({ url, method: 'GET', allowInsecure: true });
};

export const getTaskRunLog = (namespace: string, taskRunName: string): Promise<string> =>
  getFilteredRecord<any>(
    namespace,
    DataType.Log,
    AND(EQ(`data.spec.resource.kind`, 'TaskRun'), EQ(`data.spec.resource.name`, taskRunName)),
    { limit: 1 },
  ).then((x) =>
    x?.[1]?.records.length > 0
      ? // eslint-disable-next-line promise/no-nesting
        getLog(x?.[1]?.records[0].name).then((response: Log) => decodeValue(response.result.data))
      : throw404(),
  );
