import * as yup from 'yup';
import * as _ from 'lodash';
import {
  PipelineResourceTask,
  PipelineResourceTaskResource,
  PipelineTaskRef,
  PipelineTaskResource,
  PipelineTaskResources,
} from '../../../utils/pipeline-augment';
import { nameValidationSchema } from '../../import/validation-schema';
import { TASK_ERROR_STRINGS, TaskErrorType } from './const';
import { PipelineBuilderFormValues, ResourceTarget } from './types';
import { findTask } from './utils';
import { getTaskParameters, getTaskResources } from '../resource-utils';

/**
 * Get a k8s Pipeline Task from the top-level formik validation.
 *
 * @param formValues - The top-level formik form values
 * @param path - The current path to where the validation was called from
 * @param distance - How far from the root of the task is it? (defaults to 2 'hops' up)
 */
const getTask = (
  formValues: PipelineBuilderFormValues,
  path: string,
  distance: number = 2,
): PipelineResourceTask => {
  const pathParts = path.split('.');
  const taskPath = pathParts.slice(0, pathParts.length - distance);
  const taskRef: PipelineTaskRef = _.get(formValues, `${taskPath.join('.')}.taskRef`);
  return findTask(
    {
      namespacedTasks: formValues.namespacedTasks,
      clusterTasks: formValues.clusterTasks,
    },
    taskRef,
  );
};

const isParamNullable = (
  formValues: PipelineBuilderFormValues,
  path: string,
  paramName: string,
): boolean => {
  const task = getTask(formValues, path);
  const taskParam = getTaskParameters(task).find(({ name }) => name === paramName);
  return !!taskParam?.default;
};

const getResourceTarget = (path: string): ResourceTarget | null => {
  return path.match(/(inputs|outputs)/)?.[0] as ResourceTarget | null;
};

const isResourceTheCorrectType = (
  formValues: PipelineBuilderFormValues,
  path: string,
  resourceValue: string,
  resourceName: string,
): boolean => {
  const task = getTask(formValues, path, 3);
  const target = getResourceTarget(path);
  const resources = getTaskResources(task);
  const resource = resources[target]?.find(({ name }) => name === resourceName);
  const formResource = formValues.resources.find(({ name }) => name === resourceValue);

  return resource?.type === formResource?.type;
};

const getRequiredResources = (
  formValues: PipelineBuilderFormValues,
  path: string,
): PipelineResourceTaskResource[] => {
  const task = getTask(formValues, path, 1);

  const resources = getTaskResources(task);
  const inputResources = resources.inputs || [];
  const outputResources = resources.outputs || [];
  return [...inputResources, ...outputResources];
};

const isResourceRequired = (
  formValues: PipelineBuilderFormValues,
  path: string,
  resourceValue?: PipelineTaskResource[],
): boolean => {
  const resources = getRequiredResources(formValues, path);

  return resources?.length === resourceValue?.length;
};

export const validationSchema = yup.mixed().test({
  test(formValues: PipelineBuilderFormValues) {
    const { resources } = formValues;

    const resourceDefinition = yup.array().of(
      yup.object({
        name: yup.string().required('Required'),
        resource: yup
          .string()
          .test(
            'is-resource-link-broken',
            'Resource name has changed, reselect',
            (resourceValue?: string) =>
              !!resourceValue && !!resources.find(({ name }) => name === resourceValue),
          )
          .test('is-resource-type-valid', 'Resource type has changed, reselect', function(
            resourceValue?: string,
          ) {
            return isResourceTheCorrectType(formValues, this.path, resourceValue, this.parent.name);
          })
          .required('Required'),
      }),
    );

    const formDefinition = yup.object({
      name: nameValidationSchema.required('Required'),
      params: yup.array().of(
        yup.object({
          name: yup.string().required('Required'),
          description: yup.string(),
          default: yup.string(),
        }),
      ),
      resources: yup.array().of(
        yup.object({
          name: yup.string().required('Required'),
          type: yup.string().required('Required'),
        }),
      ),
      tasks: yup
        .array()
        .of(
          yup.object({
            name: yup.string().required('Required'),
            runAfter: yup.array().of(yup.string()),
            params: yup.array().of(
              yup.object({
                name: yup.string().required('Required'),
                value: yup.lazy((value) => {
                  if (Array.isArray(value)) {
                    return yup.array().of(yup.string().required('Required'));
                  }
                  return yup
                    .string()
                    .test('is-param-optional', 'Required', function(paramValue?: string) {
                      if (paramValue == null || paramValue?.trim() === '') {
                        // Param is empty -- check to see if it's required by the Task
                        return isParamNullable(formValues, this.path, this.parent.name);
                      }

                      return true;
                    });
                }),
              }),
            ),
            taskRef: yup
              .object({
                name: yup.string().required('Required'),
                kind: yup.string(),
              })
              .required('Required'),
            resources: yup
              .object({
                inputs: resourceDefinition,
                outputs: resourceDefinition,
              })
              .test(
                'is-resources-required',
                TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
                function(resourceValue?: PipelineTaskResources) {
                  return isResourceRequired(formValues, this.path, [
                    ...(resourceValue?.inputs || []),
                    ...(resourceValue?.outputs || []),
                  ]);
                },
              ),
          }),
        )
        .min(1, 'Must define at least one task')
        .required('Required'),
      taskList: yup.array().of(
        yup.object({
          name: yup.string().required('Required'),
          runAfter: yup.string(),
        }),
      ),
    });

    return formDefinition.validate(formValues, { abortEarly: false });
  },
});
