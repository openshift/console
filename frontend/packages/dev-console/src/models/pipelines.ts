import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { K8sModel } from '@console/dynamic-plugin-sdk/src';

const color = tektonGroupColor.value;

export const PipelineModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Pipeline',
  // t('dev-console~Pipeline')
  labelKey: 'dev-console~Pipeline',
  // t('dev-console~Pipelines')
  labelPluralKey: 'dev-console~Pipelines',
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
  // t('dev-console~PipelineRun')
  labelKey: 'dev-console~PipelineRun',
  // t('dev-console~PipelineRuns')
  labelPluralKey: 'dev-console~PipelineRuns',
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
  // t('dev-console~Task')
  labelKey: 'dev-console~Task',
  // t('dev-console~Tasks')
  labelPluralKey: 'dev-console~Tasks',
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
  // t('dev-console~ClusterTask')
  labelKey: 'dev-console~ClusterTask',
  // t('dev-console~ClusterTasks')
  labelPluralKey: 'dev-console~ClusterTasks',
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
  // t('dev-console~Repository')
  labelKey: 'dev-console~Repository',
  // t('dev-console~Repositories')
  labelPluralKey: 'dev-console~Repositories',
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
  // t('dev-console~PipelineResource')
  labelKey: 'dev-console~PipelineResource',
  // t('dev-console~PipelineResources')
  labelPluralKey: 'dev-console~PipelineResources',
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
  // t('dev-console~ClusterTriggerBinding')
  labelKey: 'dev-console~ClusterTriggerBinding',
  // t('dev-console~ClusterTriggerBindings')
  labelPluralKey: 'dev-console~ClusterTriggerBindings',
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
  // t('dev-console~TriggerTemplate')
  labelKey: 'dev-console~TriggerTemplate',
  // t('dev-console~TriggerTemplates')
  labelPluralKey: 'dev-console~TriggerTemplates',
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
  // t('dev-console~EventListener')
  labelKey: 'dev-console~EventListener',
  // t('dev-console~EventListeners')
  labelPluralKey: 'dev-console~EventListeners',
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
  // t('dev-console~CustomRun')
  labelKey: 'dev-console~CustomRun',
  // t('dev-console~CustomRuns')
  labelPluralKey: 'dev-console~CustomRuns',
  plural: 'customruns',
  abbr: 'CR',
  namespaced: true,
  kind: 'CustomRun',
  id: 'customrun',
  labelPlural: 'CustomRuns',
  crd: true,
  color,
};
