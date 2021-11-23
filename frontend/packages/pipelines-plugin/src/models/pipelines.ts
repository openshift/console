import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { K8sKind } from '@console/internal/module/k8s';
import { BadgeType } from '@console/shared/src/components/badges/badge-factory';

const color = tektonGroupColor.value;

export const PipelineModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'Pipeline',
  // t('pipelines-plugin~Pipeline')
  labelKey: 'pipelines-plugin~Pipeline',
  // t('pipelines-plugin~Pipelines')
  labelPluralKey: 'pipelines-plugin~Pipelines',
  plural: 'pipelines',
  abbr: 'PL',
  namespaced: true,
  kind: 'Pipeline',
  id: 'pipeline',
  labelPlural: 'Pipelines',
  crd: true,
  color,
};

export const PipelineRunModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'PipelineRun',
  // t('pipelines-plugin~PipelineRun')
  labelKey: 'pipelines-plugin~PipelineRun',
  // t('pipelines-plugin~PipelineRuns')
  labelPluralKey: 'pipelines-plugin~PipelineRuns',
  plural: 'pipelineruns',
  abbr: 'PLR',
  namespaced: true,
  kind: 'PipelineRun',
  id: 'pipelinerun',
  labelPlural: 'PipelineRuns',
  crd: true,
  color,
};

export const TaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'Task',
  // t('pipelines-plugin~Task')
  labelKey: 'pipelines-plugin~Task',
  // t('pipelines-plugin~Tasks')
  labelPluralKey: 'pipelines-plugin~Tasks',
  plural: 'tasks',
  abbr: 'T',
  namespaced: true,
  kind: 'Task',
  id: 'task',
  labelPlural: 'Tasks',
  crd: true,
  color,
};

export const TaskRunModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'TaskRun',
  // t('pipelines-plugin~TaskRun')
  labelKey: 'pipelines-plugin~TaskRun',
  // t('pipelines-plugin~TaskRuns')
  labelPluralKey: 'pipelines-plugin~TaskRuns',
  plural: 'taskruns',
  abbr: 'TR',
  namespaced: true,
  kind: 'TaskRun',
  id: 'taskrun',
  labelPlural: 'TaskRuns',
  crd: true,
  color,
};

export const PipelineResourceModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'PipelineResource',
  // t('pipelines-plugin~PipelineResource')
  labelKey: 'pipelines-plugin~PipelineResource',
  // t('pipelines-plugin~PipelineResources')
  labelPluralKey: 'pipelines-plugin~PipelineResources',
  plural: 'pipelineresources',
  abbr: 'PR',
  namespaced: true,
  kind: 'PipelineResource',
  id: 'pipelineresource',
  labelPlural: 'PipelineResources',
  crd: true,
  color,
};

export const ClusterTaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'ClusterTask',
  // t('pipelines-plugin~ClusterTask')
  labelKey: 'pipelines-plugin~ClusterTask',
  // t('pipelines-plugin~ClusterTasks')
  labelPluralKey: 'pipelines-plugin~ClusterTasks',
  plural: 'clustertasks',
  abbr: 'CT',
  namespaced: false,
  kind: 'ClusterTask',
  id: 'clustertask',
  labelPlural: 'ClusterTasks',
  crd: true,
  color,
};

export const ConditionModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Condition',
  // t('pipelines-plugin~Condition')
  labelKey: 'pipelines-plugin~Condition',
  // t('pipelines-plugin~Conditions')
  labelPluralKey: 'pipelines-plugin~Conditions',
  plural: 'conditions',
  abbr: 'C',
  namespaced: true,
  kind: 'Condition',
  id: 'condition',
  labelPlural: 'Conditions',
  crd: true,
  color,
};

export const TriggerBindingModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'TriggerBinding',
  // t('pipelines-plugin~TriggerBinding')
  labelKey: 'pipelines-plugin~TriggerBinding',
  // t('pipelines-plugin~TriggerBindings')
  labelPluralKey: 'pipelines-plugin~TriggerBindings',
  plural: 'triggerbindings',
  abbr: 'TB',
  namespaced: true,
  kind: 'TriggerBinding',
  id: 'triggerbinding',
  labelPlural: 'TriggerBindings',
  crd: true,
  color,
};

export const ClusterTriggerBindingModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'ClusterTriggerBinding',
  // t('pipelines-plugin~ClusterTriggerBinding')
  labelKey: 'pipelines-plugin~ClusterTriggerBinding',
  // t('pipelines-plugin~ClusterTriggerBindings')
  labelPluralKey: 'pipelines-plugin~ClusterTriggerBindings',
  plural: 'clustertriggerbindings',
  abbr: 'CTB',
  namespaced: false,
  kind: 'ClusterTriggerBinding',
  id: 'clustertriggerbinding',
  labelPlural: 'ClusterTriggerBindings',
  crd: true,
  color,
};

export const TriggerTemplateModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'TriggerTemplate',
  // t('pipelines-plugin~TriggerTemplate')
  labelKey: 'pipelines-plugin~TriggerTemplate',
  // t('pipelines-plugin~TriggerTemplates')
  labelPluralKey: 'pipelines-plugin~TriggerTemplates',
  plural: 'triggertemplates',
  abbr: 'TT',
  namespaced: true,
  kind: 'TriggerTemplate',
  id: 'triggertemplate',
  labelPlural: 'TriggerTemplates',
  crd: true,
  color,
};

export const EventListenerModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'EventListener',
  // t('pipelines-plugin~EventListener')
  labelKey: 'pipelines-plugin~EventListener',
  // t('pipelines-plugin~EventListeners')
  labelPluralKey: 'pipelines-plugin~EventListeners',
  plural: 'eventlisteners',
  abbr: 'EL',
  namespaced: true,
  kind: 'EventListener',
  id: 'eventlistener',
  labelPlural: 'EventListeners',
  crd: true,
  color,
};

export const RepositoryModel: K8sKind = {
  apiGroup: 'pipelinesascode.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Repository',
  // t('pipelines-plugin~Repository')
  labelKey: 'pipelines-plugin~Repository',
  // t('pipelines-plugin~Repositories')
  labelPluralKey: 'pipelines-plugin~Repositories',
  plural: 'repositories',
  abbr: 'R',
  namespaced: true,
  kind: 'Repository',
  id: 'repository',
  labelPlural: 'Repositories',
  crd: true,
  badge: BadgeType.DEV,
  color,
};
