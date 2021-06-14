import * as yup from 'yup';
import i18n from '@console/internal/i18n';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { DeploymentStrategyType, LifecycleAction } from '../deployment-strategy/utils/types';
import {
  DeploymentStrategy,
  EditDeploymentData,
  EditDeploymentFormData,
  LifecycleHookFormData,
} from './edit-deployment-types';

export const lchValidationSchema = (lch: LifecycleHookFormData) =>
  yup.object().shape({
    action: yup.string().required(i18n.t('devconsole~Required')),
    lch: yup.object().shape({
      failurePolicy: yup.string().required(i18n.t('devconsole~Required')),
      ...(lch.action === LifecycleAction.execNewPod
        ? {
            execNewPod: yup.object().shape({
              containerName: yup.string().required(i18n.t('devconsole~Required')),
              command: yup
                .array()
                .of(yup.string().required(i18n.t('devconsole~Required')))
                .required(i18n.t('devconsole~Required')),
              volumes: yup.string(),
            }),
          }
        : {}),
    }),
  });

export const lchImageStreamDataSchema = (action: string) => {
  return action === LifecycleAction.tagImages
    ? yup.object().shape({
        containerName: yup.string().required(i18n.t('devconsole~Required')),
        imageStream: yup.object({
          namespace: yup.string().required(i18n.t('devconsole~Required')),
          image: yup.string().required(i18n.t('devconsole~Required')),
          tag: yup.string().required(i18n.t('devconsole~Required')),
        }),
      })
    : null;
};

export const deploymentStrategySchema = (strategy: DeploymentStrategy) => {
  switch (strategy.type) {
    case DeploymentStrategyType.recreateParams: {
      const { pre, mid, post } = strategy.recreateParams ?? {};
      return yup.object().shape({
        type: yup.string(),
        recreateParams: yup.object().shape({
          timeoutSeconds: yup.number(),
          ...(pre?.isAddingLch ? { pre: lchValidationSchema(pre) } : {}),
          ...(mid?.isAddingLch ? { mid: lchValidationSchema(mid) } : {}),
          ...(post?.isAddingLch ? { post: lchValidationSchema(post) } : {}),
        }),
        imageStreamData: yup.object().shape({
          ...(pre?.isAddingLch ? { pre: lchImageStreamDataSchema(pre.action) } : {}),
          ...(mid?.isAddingLch ? { mid: lchImageStreamDataSchema(mid.action) } : {}),
          ...(post?.isAddingLch ? { post: lchImageStreamDataSchema(post.action) } : {}),
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
          ...(pre?.isAddingLch ? { pre: lchValidationSchema(pre) } : {}),
          ...(post?.isAddingLch ? { post: lchValidationSchema(post) } : {}),
          updatePeriodSeconds: yup.number(),
          intervalSeconds: yup.number(),
          maxSurge: yup.string(),
          maxUnavailable: yup.string(),
        }),
        imageStreamData: yup.object().shape({
          ...(pre?.isAddingLch ? { pre: lchImageStreamDataSchema(pre.action) } : {}),
          ...(post?.isAddingLch ? { post: lchImageStreamDataSchema(post.action) } : {}),
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

export const editDeploymentFormSchema = (formValues: EditDeploymentFormData) =>
  yup.object({
    deploymentStrategy: deploymentStrategySchema(formValues.deploymentStrategy),
    fromImageStreamTag: yup.boolean(),
    ...(!formValues.fromImageStreamTag
      ? { imageName: yup.string().required(i18n.t('devconsole~Required')) }
      : {}),
    imageStream: yup.object().when('fromImageStreamTag', {
      is: true,
      then: yup.object({
        namespace: yup.string().required(i18n.t('devconsole~Required')),
        image: yup.string().required(i18n.t('devconsole~Required')),
        tag: yup.string().required(i18n.t('devconsole~Required')),
      }),
    }),
    isi: yup.object().when('fromImageStreamTag', {
      is: true,
      then: yup.object({
        name: yup.string().required(i18n.t('devconsole~Required')),
      }),
    }),
  });

export const validationSchema = () =>
  yup.mixed().test({
    test(formValues: EditDeploymentData) {
      const formYamlDefinition = yup.object({
        editorType: yup.string().oneOf(Object.values(EditorType)),
        yamlData: yup.string(),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: editDeploymentFormSchema(formValues.formData),
        }),
      });

      return formYamlDefinition.validate(formValues, { abortEarly: false });
    },
  });
