import { K8sKind } from '@console/internal/module/k8s';
import { BadgeType } from '@console/shared/src/components/badges/badge-factory';

export const PipelineModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Pipeline',
  plural: 'pipelines',
  abbr: 'PL',
  namespaced: true,
  kind: 'Pipeline',
  id: 'pipeline',
  labelPlural: 'Pipelines',
  crd: true,
  badge: BadgeType.DEV,
};

export const PipelineRunModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Pipeline Run',
  plural: 'pipelineruns',
  abbr: 'PLR',
  namespaced: true,
  kind: 'PipelineRun',
  id: 'pipelinerun',
  labelPlural: 'Pipeline Runs',
  crd: true,
  badge: BadgeType.DEV,
};

export const TaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Task',
  plural: 'tasks',
  abbr: 'T',
  namespaced: true,
  kind: 'Task',
  id: 'task',
  labelPlural: 'Tasks',
  crd: true,
  badge: BadgeType.DEV,
};

export const TaskRunModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Task Run',
  plural: 'taskruns',
  abbr: 'TR',
  namespaced: true,
  kind: 'TaskRun',
  id: 'taskrun',
  labelPlural: 'Task Runs',
  crd: true,
  badge: BadgeType.DEV,
};

export const PipelineResourceModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Pipeline Resource',
  plural: 'pipelineresources',
  abbr: 'PR',
  namespaced: true,
  kind: 'PipelineResource',
  id: 'pipelineresource',
  labelPlural: 'Pipeline Resources',
  crd: true,
  badge: BadgeType.DEV,
};

export const ClusterTaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Cluster Task',
  plural: 'clustertasks',
  abbr: 'CT',
  namespaced: false,
  kind: 'ClusterTask',
  id: 'clustertask',
  labelPlural: 'Cluster Tasks',
  crd: true,
  badge: BadgeType.DEV,
};
