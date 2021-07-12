import i18n from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import {
  PipelineTaskResource,
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskWorkspace,
  TektonResource,
  TektonWorkspace,
  ResourceTarget,
  TektonResourceGroup,
  WhenExpression,
} from '../../../types';
import { paramIsRequired } from '../../../utils/common';
import { PipelineResourceType } from '../const';
import { getTaskParameters, getTaskResources } from '../resource-utils';
import { getTaskErrorString, TaskErrorType } from './const';
import { PipelineBuilderFormYamlValues, TaskType } from './types';
import { findTaskFromFormikData } from './utils';

/**
 * Checks to see if the params without a default have a value
 */
const areRequiredParamsAdded = (
  formValues: PipelineBuilderFormYamlValues,
  pipelineTask: PipelineTask,
  params: PipelineTaskParam[] = [],
): boolean => {
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No task, means we don't know if the param is nullable, so pass the test
    return true;
  }

  const requiredTaskParams = getTaskParameters(task).filter(paramIsRequired);
  if (requiredTaskParams.length === 0) {
    // No required params, no issue
    return true;
  }

  return !requiredTaskParams.some((requiredParam) => {
    const matchingParam = params.find(({ name }) => name === requiredParam.name);
    return !matchingParam || !matchingParam.value;
  });
};

const areRequiredWhenExpressionsAdded = (when: WhenExpression[] = []) => {
  if (when.length === 0) {
    return true;
  }
  const invalidValues = (values: string[]) =>
    (values || []).length === 0 || values.some((v) => v?.length === 0);
  return !when?.some(
    (w) => w?.input?.length === 0 || w?.operator?.length === 0 || invalidValues(w?.values),
  );
};

/**
 * Finds the resource tied to the resourceName.
 */
const findResource = (
  formValues: PipelineBuilderFormYamlValues,
  path: string,
  resourceName: string,
  taskType: TaskType,
): TektonResource | false => {
  // Since we do not have easy access to the taskRef, walk the path back ot the root
  // eg. path === formData.tasks[0].resources.inputs[0].resource
  const pathParts = path.split('.');
  const tasksReferenceIdx = pathParts.findIndex((pathPart) => pathPart.startsWith(taskType));
  const taskPath = pathParts.slice(0, tasksReferenceIdx + 1);
  const pipelineTask: PipelineTask = _.get(formValues, `${taskPath.join('.')}`);

  // Find the task based on the ref
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No task, can't find resources
    return false;
  }

  const target = path.match(/(inputs|outputs)/)?.[0] as ResourceTarget;
  if (!target) {
    // Shouldn't happen, but bail out if it does
    return false;
  }
  const resources = getTaskResources(task);
  return resources[target]?.find(({ name }) => name === resourceName);
};

/**
 * Checks to see if the resourceValue is the same type of the resourceName's type
 */
const isResourceTheCorrectType = (
  formValues: PipelineBuilderFormYamlValues,
  path: string,
  resourceValue: string,
  resourceName: string,
  taskType: TaskType,
): boolean => {
  const resource = findResource(formValues, path, resourceName, taskType);
  if (resource === false) {
    // Failed to find the resource, nothing we can do here
    return true;
  }
  const formResource = formValues.formData.resources.find(({ name }) => name === resourceValue);

  return resource.type === formResource?.type;
};

/**
 * Checks if there are more resources available of the resourceName's type
 */
const hasResourcesOfTheSameType = (
  formValues: PipelineBuilderFormYamlValues,
  path: string,
  resourceName: string,
  taskType: TaskType,
): boolean => {
  const resource = findResource(formValues, path, resourceName, taskType);
  if (resource === false) {
    // Failed to find the resource, nothing we can do here
    return true;
  }

  return formValues.formData.resources.some(({ type }) => resource.type === type);
};

/**
 * Check to see if this task has all the resources (both input + output) that the stand-alone TaskKind requests.
 */
const hasRequiredResources = (
  formValues: PipelineBuilderFormYamlValues,
  pipelineTask: PipelineTask,
  taskResources: PipelineTaskResource[],
): boolean => {
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No matching task, can't verify if resources are needed
    return true;
  }

  const resources = getTaskResources(task);
  const requiredResources = [...(resources.inputs || []), ...(resources.outputs || [])].filter(
    (resource) => !resource.optional,
  );
  const noResources = !taskResources || taskResources.length === 0;
  const needResources = requiredResources.length > 0;
  if (noResources) {
    // If we have no resource, we are done; if we need resources we fail
    return !needResources;
  }
  const resourcesNames = taskResources.map(({ name }) => name);
  return !requiredResources.some(({ name }) => !resourcesNames.includes(name));
};

/**
 * Finds the workspace tied to the workspaceName.
 */
const findWorkspace = (
  formValues: PipelineBuilderFormYamlValues,
  path: string,
  workspaceName: string,
): TektonWorkspace | false => {
  // Search the taskPath which is parent of the given path.
  // If an path like formData.finallyTasks[0].workspaces[0].workspace is given
  // it returns the path formData.finallyTasks[0]
  const taskPath = path
    .split('.')
    .slice(0, 2)
    .join('.');
  const pipelineTask: PipelineTask = _.get(formValues, taskPath);

  // Find the task based on the ref
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No task, can't find resources
    return false;
  }
  return task.spec.workspaces?.find(({ name }) => name === workspaceName);
};

/**
 * Check to see if this task has all the workspaces the stand-alone TaskKind requests.
 */
const hasRequiredWorkspaces = (
  formValues: PipelineBuilderFormYamlValues,
  pipelineTask: PipelineTask,
  taskWorkspaces: PipelineTaskWorkspace[],
) => {
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No matching task, can't verify if workspaces are needed
    return true;
  }

  const requiredWorkspaces = task.spec.workspaces?.filter(({ optional }) => !optional) || [];
  const noWorkspaces = !taskWorkspaces || taskWorkspaces.length === 0;
  const needWorkspaces = requiredWorkspaces?.length > 0;
  if (noWorkspaces) {
    // If we have no workspaces, we are done; if we need workspaces we fail
    return !needWorkspaces;
  }
  const workspaceNames = taskWorkspaces.map(({ name }) => name);
  return !requiredWorkspaces.some(({ name }) => !workspaceNames.includes(name));
};

/**
 * Checks to make sure all runAfter values are task/listTask names.
 */
const runAfterMatches = (
  formValues: PipelineBuilderFormYamlValues,
  runAfter: string[],
  thisTaskName: string,
): boolean => {
  if (!runAfter || runAfter.length === 0) {
    // No failure case if we don't have a run after
    return true;
  }
  if (runAfter.includes(thisTaskName)) {
    // Fails if it includes itself (can't run after yourself)
    return false;
  }

  const {
    formData: { tasks, listTasks },
  } = formValues;
  const taskNames = tasks.map((t) => t.name).concat(listTasks.map((t) => t.name));
  return !runAfter.some((name) => !taskNames.includes(name));
};

/**
 * Validates a runAfter to have valid values.
 *
 * Note: Expects to be in an object of { name: string(), runAfter: thisFunction(...), ... }
 */
const validRunAfter = (formValues: PipelineBuilderFormYamlValues) => {
  return yup
    .array()
    .of(yup.string())
    .test('tasks-matches-runAfters', i18n.t('pipelines-plugin~Invalid runAfter'), function(
      runAfter: string[],
    ) {
      return runAfterMatches(formValues, runAfter, this.parent.name);
    });
};

/**
 * Validates task resources are defined correctly.
 */
const resourceDefinition = (formValues: PipelineBuilderFormYamlValues, taskType: TaskType) => {
  const {
    formData: { resources },
  } = formValues;

  return yup.array().of(
    yup.object({
      name: yup.string().required(i18n.t('pipelines-plugin~Required')),
      resource: yup
        .string()
        .test(
          'are-resources-available',
          i18n.t('pipelines-plugin~No resources available. Add pipeline resources.'),
          function() {
            const resource = findResource(formValues, this.path, this.parent.name, taskType);
            return !resource || resource.optional || resources?.length > 0;
          },
        )
        .test(
          'is-resources-of-type-available',
          i18n.t('pipelines-plugin~No resources available. Add pipeline resources.'),
          function() {
            const resource = findResource(formValues, this.path, this.parent.name, taskType);
            return (
              !resource ||
              resource.optional ||
              hasResourcesOfTheSameType(formValues, this.path, this.parent.name, taskType)
            );
          },
        )
        .test('is-resource-is-required', i18n.t('pipelines-plugin~Required'), function(
          resourceValue?: string,
        ) {
          const resource = findResource(formValues, this.path, this.parent.name, taskType);
          return !resource || resource.optional || resourceValue;
        })
        .test(
          'is-resource-link-broken',
          i18n.t('pipelines-plugin~Resource name has changed; reselect.'),
          (resourceValue?: string) =>
            !resourceValue || !!resources.find(({ name }) => name === resourceValue),
        )
        .test(
          'is-resource-type-valid',
          i18n.t('pipelines-plugin~Resource type has changed; reselect.'),
          function(resourceValue?: string) {
            if (!resourceValue) {
              return true;
            }
            return isResourceTheCorrectType(
              formValues,
              this.path,
              resourceValue,
              this.parent.name,
              taskType,
            );
          },
        ),
    }),
  );
};

/**
 * Validates Tasks or Finally Tasks for valid structure
 */
const taskValidation = (formValues: PipelineBuilderFormYamlValues, taskType: TaskType) => {
  const {
    formData: { workspaces },
  } = formValues;

  return yup.array().of(
    yup
      .object({
        // `name` is properly validated in TaskSidebarName
        name: yup.string().required(i18n.t('pipelines-plugin~Required')),
        taskRef: yup
          .object({
            name: yup.string().required(i18n.t('pipelines-plugin~Required')),
            kind: yup.string(),
          })
          .default(undefined),
        taskSpec: yup.object(),
        runAfter: validRunAfter(formValues),
        params: yup
          .array()
          .of(
            yup.object({
              name: yup.string().required(i18n.t('pipelines-plugin~Required')),
              value: yup.lazy((value) => {
                if (Array.isArray(value)) {
                  return yup.array().of(yup.string().required(i18n.t('pipelines-plugin~Required')));
                }
                return yup.string();
              }),
            }),
          )
          .test(
            'is-param-optional',
            getTaskErrorString(TaskErrorType.MISSING_REQUIRED_PARAMS),
            function(params?: PipelineTaskParam[]) {
              return areRequiredParamsAdded(formValues, this.parent, params);
            },
          ),
        resources: yup
          .object({
            inputs: resourceDefinition(formValues, taskType),
            outputs: resourceDefinition(formValues, taskType),
          })
          .test(
            'is-resources-required',
            getTaskErrorString(TaskErrorType.MISSING_RESOURCES),
            function(resourceValue?: TektonResourceGroup<PipelineTaskResource>) {
              return hasRequiredResources(formValues, this.parent, [
                ...(resourceValue?.inputs || []),
                ...(resourceValue?.outputs || []),
              ]);
            },
          ),
        when: yup
          .array()
          .of(
            yup.object({
              input: yup.string().required(i18n.t('pipelines-plugin~Required')),
              operator: yup.string().required(i18n.t('pipelines-plugin~Required')),
              values: yup.array().of(yup.string().required(i18n.t('pipelines-plugin~Required'))),
            }),
          )
          .test(
            'is-when-expression-required',
            getTaskErrorString(TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS),
            function(when?: WhenExpression[]) {
              return areRequiredWhenExpressionsAdded(when);
            },
          ),

        workspaces: yup
          .array()
          .of(
            yup.object({
              name: yup.string().required(i18n.t('pipelines-plugin~Required')),
              workspace: yup
                .string()
                .test('is-workspace-is-required', i18n.t('pipelines-plugin~Required'), function(
                  workspaceValue?: string,
                ) {
                  const workspace = findWorkspace(formValues, this.path, this.parent.name);
                  return !workspace || workspace.optional || workspaceValue;
                })
                .test(
                  'are-workspaces-available',
                  i18n.t('pipelines-plugin~No workspaces available. Add pipeline workspaces.'),
                  () => workspaces?.length > 0,
                )
                .test(
                  'is-workspace-link-broken',
                  i18n.t('pipelines-plugin~Workspace name has changed; reselect.'),
                  (workspaceValue?: string) =>
                    !workspaceValue || !!workspaces.find(({ name }) => name === workspaceValue),
                ),
            }),
          )
          .test(
            'is-workspaces-required',
            getTaskErrorString(TaskErrorType.MISSING_WORKSPACES),
            function(workspaceList?: PipelineTaskWorkspace[]) {
              return hasRequiredWorkspaces(formValues, this.parent, workspaceList);
            },
          ),
      })
      .test(
        'taskRef-or-taskSpec',
        i18n.t('pipelines-plugin~TaskSpec or TaskRef must be provided.'),
        function(task: PipelineTask) {
          return !!task.taskRef || !!task.taskSpec;
        },
      ),
  );
};

/**
 * Validates the Form side of the Form/YAML switcher
 */
const pipelineBuilderFormSchema = (formValues: PipelineBuilderFormYamlValues) => {
  return yup.object({
    name: nameValidationSchema((tKey) => i18n.t(tKey)).required(
      i18n.t('pipelines-plugin~Required'),
    ),
    params: yup.array().of(
      yup.object({
        name: yup.string().required(i18n.t('pipelines-plugin~Required')),
        description: yup.string(),
        default: yup.string(), // TODO: should include string[]
        // TODO: should have type (string | string[])
      }),
    ),
    resources: yup.array().of(
      yup.object({
        name: yup.string().required(i18n.t('pipelines-plugin~Required')),
        type: yup
          .string()
          .oneOf(Object.values(PipelineResourceType))
          .required(i18n.t('pipelines-plugin~Required')),
        // TODO: should include optional flag
      }),
    ),
    workspaces: yup.array().of(
      yup.object({
        name: yup.string().required(i18n.t('pipelines-plugin~Required')),
        // TODO: should include optional flag
      }),
    ),
    tasks: taskValidation(formValues, 'tasks')
      .min(1, i18n.t('pipelines-plugin~Must define at least one task.'))
      .required(i18n.t('pipelines-plugin~Required')),
    finallyTasks: taskValidation(formValues, 'finallyTasks'),
    listTasks: yup.array().of(
      yup.object({
        name: yup.string().required(i18n.t('pipelines-plugin~Required')),
        runAfter: validRunAfter(formValues),
      }),
    ),
    finallyListTasks: yup.array().of(
      yup.object({
        name: yup.string().required(i18n.t('pipelines-plugin~Required')),
      }),
    ),
  });
};

export const validationSchema = () =>
  yup.mixed().test({
    test(formValues: PipelineBuilderFormYamlValues) {
      const formYamlDefinition = yup.object({
        editorType: yup.string().oneOf(Object.values(EditorType)),
        yamlData: yup.string(),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: pipelineBuilderFormSchema(formValues),
        }),
      });

      return formYamlDefinition.validate(formValues, { abortEarly: false });
    },
  });
