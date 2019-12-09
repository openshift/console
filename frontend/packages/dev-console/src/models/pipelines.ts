import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens';
import { K8sKind } from '@console/internal/module/k8s';
import { BadgeType } from '@console/shared/src/components/badges/badge-factory';

const color = tektonGroupColor.value;

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
  color,
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
  color,
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
  color,
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
  color,
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
  color,
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
  color,
};

export const ConditionModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Condition',
  plural: 'conditions',
  abbr: 'C',
  namespaced: true,
  kind: 'Condition',
  id: 'condition',
  labelPlural: 'Conditions',
  crd: true,
  badge: BadgeType.DEV,
  color,
};
