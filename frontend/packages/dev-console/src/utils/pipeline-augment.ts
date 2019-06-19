import { K8sResourceKind } from '@console/internal/module/k8s';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

interface Metadata {
  name: string;
  namespace?: string;
}
export interface PropPipelineData {
  metadata: Metadata;
  latestRun?: PipelineRun;
}

export interface Resource {
  propsReferenceForRuns: string[];
  resources: FirehoseResource[];
}

export interface PipelineResource {
  name?: string;
  type?: string;
  resourceRef?: {
    name?: string;
  };
}

export interface Runs {
  data?: PipelineRun[];
}

export type KeyedRuns = { [key: string]: Runs };

export interface Pipeline extends K8sResourceKind {
  latestRun?: PipelineRun;
  spec?: { pipelineRef?: { name: string }; params: Param[]; resources: PipelineResource[] };
}

export interface PipelineRun extends K8sResourceKind {
  spec?: {
    pipelineRef?: { name: string };
    params: Param[];
    trigger: {
      type: string;
    };
    resources: PipelineResource[];
  };
  status?: {
    succeededCondition?: string;
    creationTimestamp?: string;
    conditions?: Condition[];
    startTime?: string;
    completionTime?: string;
  };
}

export interface Condition {
  type: string;
  status: string;
}

export interface Param {
  input: string;
  output: string;
  resource?: object;
}

interface FirehoseResource {
  kind: string;
  namespace?: string;
  isList?: boolean;
  selector?: object;
}

export const getResources = (data: PropPipelineData[]): Resource => {
  const resources = [];
  const propsReferenceForRuns = [];
  if (data && data.length > 0) {
    data.forEach((pipeline, i) => {
      if (pipeline.metadata && pipeline.metadata.namespace && pipeline.metadata.name) {
        propsReferenceForRuns.push(`PipelineRun_${i}`);
        resources.push({
          kind: 'PipelineRun',
          namespace: pipeline.metadata.namespace,
          isList: true,
          prop: `PipelineRun_${i}`,
          selector: {
            'tekton.dev/pipeline': pipeline.metadata.name,
          },
        });
      }
    });
    return { propsReferenceForRuns, resources };
  }
  return { propsReferenceForRuns: null, resources: null };
};

export const getLatestRun = (runs: Runs, field: string): PipelineRun => {
  if (!runs || !runs.data || !(runs.data.length > 0) || !field) {
    return null;
  }
  let latestRun = runs.data[0];
  if (field === 'creationTimestamp') {
    for (let i = 1; i < runs.data.length; i++) {
      latestRun =
        runs.data[i] &&
        runs.data[i].metadata &&
        runs.data[i].metadata[field] &&
        new Date(runs.data[i].metadata[field]) > new Date(latestRun.metadata[field])
          ? runs.data[i]
          : latestRun;
    }
  } else if (field === 'startTime' || field === 'completionTime') {
    for (let i = 1; i < runs.data.length; i++) {
      latestRun =
        runs.data[i] &&
        runs.data[i].status &&
        runs.data[i].status[field] &&
        new Date(runs.data[i].status[field]) > new Date(latestRun.status[field])
          ? runs.data[i]
          : latestRun;
    }
  } else {
    latestRun = runs.data[runs.data.length - 1];
  }
  if (!latestRun.status) {
    latestRun = { ...latestRun, status: {} };
  }
  if (!latestRun.status.succeededCondition) {
    latestRun.status = { ...latestRun.status, succeededCondition: '' };
  }
  latestRun.status.succeededCondition = pipelineRunFilterReducer(latestRun);
  return latestRun;
};

export const augmentRunsToData = (
  data: PropPipelineData[],
  propsReferenceForRuns: string[],
  runs: { [key: string]: Runs },
) => {
  if (propsReferenceForRuns) {
    propsReferenceForRuns.forEach(
      (reference, i) => (data[i].latestRun = getLatestRun(runs[reference], 'creationTimestamp')),
    );
  }
  return data;
};
