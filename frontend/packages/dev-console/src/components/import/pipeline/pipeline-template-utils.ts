import * as _ from 'lodash';
import { K8sResourceKind, k8sList, k8sGet, k8sCreate } from '@console/internal/module/k8s';
import { PipelineModel, TaskModel } from '../../../models';
import { GitImportFormData } from '../import-types';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';

export const getPipelineTaskRefs = (pipeline: K8sResourceKind): string[] => {
  const taskRefs = _.get(pipeline, 'spec.tasks');
  return taskRefs && taskRefs.map((task) => _.get(task, 'taskRef.name'));
};

export const getPipelineTemplate = async (runtime: string): Promise<K8sResourceKind> => {
  const templates = await k8sList(PipelineModel, {
    ns: 'openshift',
    labelSelector: { 'pipeline.openshift.io/runtime': runtime },
  });
  return templates && templates[0];
};

export const copyPipelineTasks = (taskRefs: string[], namespace: string) => {
  taskRefs.forEach(async (taskRef) => {
    try {
      const task = await k8sGet(TaskModel, taskRef, 'openshift');
      task.metadata = { name: task.metadata.name, namespace };
      await k8sCreate(TaskModel, task, namespace).catch(() => {});
    } catch (err) {
      throw err;
    }
  });
};

export const createGitResource = (url: string, ref: string = 'master', namespace: string) => {
  const params = { url, revision: ref };
  return createPipelineResource(params, 'git', namespace);
};

export const createImageResource = (name: string, namespace: string) => {
  const params = {
    url: `image-registry.openshift-image-registry.svc:5000/${namespace}/${name}`,
  };

  return createPipelineResource(params, 'image', namespace);
};

export const createPipelineForImportFlow = async (formData: GitImportFormData) => {
  const {
    name,
    project: { name: namespace },
    git,
    pipeline,
  } = formData;
  const template = _.cloneDeep(pipeline.template);

  template.metadata = {
    name: `${name}-${template.metadata.name}`,
    namespace,
    labels: template.metadata.labels,
  };

  try {
    copyPipelineTasks(pipeline.taskRefs, namespace);
    await createGitResource(git.url, git.ref, namespace);
    await createImageResource(name, namespace);
  } catch (err) {
    throw err;
  }

  return k8sCreate(PipelineModel, template, { ns: namespace });
};
