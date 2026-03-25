import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src';

const color = tektonGroupColor.value;

export const PipelineModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Pipeline',
  // t('devconsole~Pipeline')
  labelKey: 'devconsole~Pipeline',
  // t('devconsole~Pipelines')
  labelPluralKey: 'devconsole~Pipelines',
  plural: 'pipelines',
  abbr: 'PL',
  namespaced: true,
  kind: 'Pipeline',
  id: 'pipeline',
  labelPlural: 'Pipelines',
  crd: true,
  color,
};

export const PipelineRunModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'PipelineRun',
  // t('devconsole~PipelineRun')
  labelKey: 'devconsole~PipelineRun',
  // t('devconsole~PipelineRuns')
  labelPluralKey: 'devconsole~PipelineRuns',
  plural: 'pipelineruns',
  abbr: 'PLR',
  namespaced: true,
  kind: 'PipelineRun',
  id: 'pipelinerun',
  labelPlural: 'PipelineRuns',
  crd: true,
  color,
};

export const TaskModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Task',
  // t('devconsole~Task')
  labelKey: 'devconsole~Task',
  // t('devconsole~Tasks')
  labelPluralKey: 'devconsole~Tasks',
  plural: 'tasks',
  abbr: 'T',
  namespaced: true,
  kind: 'Task',
  id: 'task',
  labelPlural: 'Tasks',
  crd: true,
  color,
};

export const ClusterTaskModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'ClusterTask',
  // t('devconsole~ClusterTask')
  labelKey: 'devconsole~ClusterTask',
  // t('devconsole~ClusterTasks')
  labelPluralKey: 'devconsole~ClusterTasks',
  plural: 'clustertasks',
  abbr: 'CT',
  namespaced: false,
  kind: 'ClusterTask',
  id: 'clustertask',
  labelPlural: 'ClusterTasks',
  crd: true,
  color,
};

export const RepositoryModel: K8sModel = {
  apiGroup: 'pipelinesascode.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Repository',
  // t('devconsole~Repository')
  labelKey: 'devconsole~Repository',
  // t('devconsole~Repositories')
  labelPluralKey: 'devconsole~Repositories',
  plural: 'repositories',
  abbr: 'R',
  namespaced: true,
  kind: 'Repository',
  id: 'repository',
  labelPlural: 'Repositories',
  crd: true,
  color,
};

export const PipelineResourceModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'PipelineResource',
  // t('devconsole~PipelineResource')
  labelKey: 'devconsole~PipelineResource',
  // t('devconsole~PipelineResources')
  labelPluralKey: 'devconsole~PipelineResources',
  plural: 'pipelineresources',
  abbr: 'PR',
  namespaced: true,
  kind: 'PipelineResource',
  id: 'pipelineresource',
  labelPlural: 'PipelineResources',
  crd: true,
  color,
};

export const ClusterTriggerBindingModel: K8sModel = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'ClusterTriggerBinding',
  // t('devconsole~ClusterTriggerBinding')
  labelKey: 'devconsole~ClusterTriggerBinding',
  // t('devconsole~ClusterTriggerBindings')
  labelPluralKey: 'devconsole~ClusterTriggerBindings',
  plural: 'clustertriggerbindings',
  abbr: 'CTB',
  namespaced: false,
  kind: 'ClusterTriggerBinding',
  id: 'clustertriggerbinding',
  labelPlural: 'ClusterTriggerBindings',
  crd: true,
  color,
};

export const TriggerTemplateModel: K8sModel = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'TriggerTemplate',
  // t('devconsole~TriggerTemplate')
  labelKey: 'devconsole~TriggerTemplate',
  // t('devconsole~TriggerTemplates')
  labelPluralKey: 'devconsole~TriggerTemplates',
  plural: 'triggertemplates',
  abbr: 'TT',
  namespaced: true,
  kind: 'TriggerTemplate',
  id: 'triggertemplate',
  labelPlural: 'TriggerTemplates',
  crd: true,
  color,
};

export const EventListenerModel: K8sModel = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'EventListener',
  // t('devconsole~EventListener')
  labelKey: 'devconsole~EventListener',
  // t('devconsole~EventListeners')
  labelPluralKey: 'devconsole~EventListeners',
  plural: 'eventlisteners',
  abbr: 'EL',
  namespaced: true,
  kind: 'EventListener',
  id: 'eventlistener',
  labelPlural: 'EventListeners',
  crd: true,
  color,
};

export const CustomRunModelV1Beta1: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'CustomRun',
  // t('devconsole~CustomRun')
  labelKey: 'devconsole~CustomRun',
  // t('devconsole~CustomRuns')
  labelPluralKey: 'devconsole~CustomRuns',
  plural: 'customruns',
  abbr: 'CR',
  namespaced: true,
  kind: 'CustomRun',
  id: 'customrun',
  labelPlural: 'CustomRuns',
  crd: true,
  color,
};
