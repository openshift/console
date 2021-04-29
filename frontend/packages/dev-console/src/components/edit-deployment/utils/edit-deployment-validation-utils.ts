import * as yup from 'yup';
import { TFunction } from 'i18next';
import {
  DeploymentStrategy,
  EditDeploymentData,
  EditDeploymentFormData,
  LifecycleHookFormData,
} from './edit-deployment-types';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { DeploymentStrategyType, LifecycleAction } from '../deployment-strategy/utils/types';

export const lchValidationSchema = (lch: LifecycleHookFormData, t: TFunction) =>
  yup.object().shape({
    action: yup.string().required(t('devconsole~Required')),
    lch: yup.object().shape({
      failurePolicy: yup.string().required(t('devconsole~Required')),
      ...(lch.action === LifecycleAction.execNewPod
        ? {
            execNewPod: yup.object().shape({
              containerName: yup.string().required(t('devconsole~Required')),
              command: yup
                .array()
                .of(yup.string().required(t('devconsole~Required')))
                .required(t('devconsole~Required')),
              volumes: yup.string(),
            }),
          }
        : {}),
    }),
  });

export const lchImageStreamDataSchema = (action: string, t: TFunction) => {
  return action === LifecycleAction.tagImages
    ? yup.object().shape({
        containerName: yup.string().required(t('devconsole~Required')),
        imageStream: yup.object({
          namespace: yup.string().required(t('devconsole~Required')),
          image: yup.string().required(t('devconsole~Required')),
          tag: yup.string().required(t('devconsole~Required')),
        }),
      })
    : null;
};

export const deploymentStrategySchema = (strategy: DeploymentStrategy, t: TFunction) => {
  switch (strategy.type) {
    case DeploymentStrategyType.recreateParams: {
      const { pre, mid, post } = strategy.recreateParams;
      return yup.object().shape({
        type: yup.string(),
        recreateParams: yup.object().shape({
          timeoutSeconds: yup.number(),
          ...(pre?.isAddingLch ? { pre: lchValidationSchema(pre, t) } : {}),
          ...(mid?.isAddingLch ? { mid: lchValidationSchema(mid, t) } : {}),
          ...(post?.isAddingLch ? { post: lchValidationSchema(post, t) } : {}),
        }),
        imageStreamData: yup.object().shape({
          ...(pre?.isAddingLch ? { pre: lchImageStreamDataSchema(pre.action, t) } : {}),
          ...(mid?.isAddingLch ? { mid: lchImageStreamDataSchema(mid.action, t) } : {}),
          ...(post?.isAddingLch ? { post: lchImageStreamDataSchema(post.action, t) } : {}),
        }),
      });
    }
    case DeploymentStrategyType.customParams: {
      return yup.object().shape({
        type: yup.string(),
        customParans: yup.object().shape({
          command: yup.array().of(yup.string()),
          image: yup.string(),
        }),
      });
    }
    case DeploymentStrategyType.rollingParams: {
      const { pre, post } = strategy.rollingParams;
      return yup.object().shape({
        type: yup.string(),
        rollingParams: yup.object().shape({
          timeoutSeconds: yup.number(),
          ...(pre?.isAddingLch ? { pre: lchValidationSchema(pre, t) } : {}),
          ...(post?.isAddingLch ? { post: lchValidationSchema(post, t) } : {}),
          updatePeriodSeconds: yup.number(),
          intervalSeconds: yup.number(),
          maxSurge: yup.string(),
          maxUnavailable: yup.string(),
        }),
        imageStreamData: yup.object().shape({
          ...(pre?.isAddingLch ? { pre: lchImageStreamDataSchema(pre.action, t) } : {}),
          ...(post?.isAddingLch ? { post: lchImageStreamDataSchema(post.action, t) } : {}),
        }),
      });
    }
    case DeploymentStrategyType.rollingUpdate: {
      return yup.object().shape({
        type: yup.string(),
        rollingUpdate: yup.object().shape({
          maxSurge: yup.string(),
          maxUnavailable: yup.string(),
        }),
      });
    }
    default:
      return null;
  }
};

export const editDeploymentFormSchema = (formValues: EditDeploymentFormData, t: TFunction) =>
  yup.object({
    deploymentStrategy: deploymentStrategySchema(formValues.deploymentStrategy, t),
    fromImageStreamTag: yup.boolean(),
    ...(!formValues.fromImageStreamTag
      ? { imageName: yup.string().required(t('devconsole~Required')) }
      : {}),
    imageStream: yup.object().when('fromImageStreamTag', {
      is: true,
      then: yup.object({
        namespace: yup.string().required(t('devconsole~Required')),
        image: yup.string().required(t('devconsole~Required')),
        tag: yup.string().required(t('devconsole~Required')),
      }),
    }),
  });

export const validationSchema = (t: TFunction) =>
  yup.mixed().test({
    test(formValues: EditDeploymentData) {
      const formYamlDefinition = yup.object({
        editorType: yup.string().oneOf(Object.values(EditorType)),
        yamlData: yup.string(),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: editDeploymentFormSchema(formValues.formData, t),
        }),
      });

      return formYamlDefinition.validate(formValues, { abortEarly: false });
    },
  });
