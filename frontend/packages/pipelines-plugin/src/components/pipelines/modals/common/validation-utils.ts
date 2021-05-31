import { TFunction } from 'i18next';
import * as yup from 'yup';
import { PipelineResourceType, VolumeTypes } from '../../const';
import { taskParamIsRequired } from '../../pipeline-builder/utils';
import { CREATE_PIPELINE_RESOURCE } from './const';

export const validateResourceType = (t: TFunction) =>
  yup.object().shape({
    type: yup.string().required(t('pipelines-plugin~Required')),
    params: yup
      .object()
      .when('type', {
        is: PipelineResourceType.git,
        then: yup.object({
          url: yup.string().required(t('pipelines-plugin~Required')),
          revision: yup.string(),
        }),
      })
      .when('type', {
        is: PipelineResourceType.image,
        then: yup.object({
          url: yup.string().required(t('pipelines-plugin~Required')),
        }),
      })
      .when('type', {
        is: PipelineResourceType.storage,
        then: yup.object({
          type: yup.string().required(t('pipelines-plugin~Required')),
          location: yup.string().required(t('pipelines-plugin~Required')),
          dir: yup.string(),
        }),
      })
      .when('type', {
        is: PipelineResourceType.cluster,
        then: yup.object({
          name: yup.string().required(t('pipelines-plugin~Required')),
          url: yup.string().required(t('pipelines-plugin~Required')),
          username: yup.string().required(t('pipelines-plugin~Required')),
          password: yup.string(),
          insecure: yup.string(),
        }),
      }),
    secrets: yup.object().when('type', {
      is: PipelineResourceType.cluster,
      then: yup.object({
        cadata: yup.string().required(t('pipelines-plugin~Required')),
        token: yup.string(),
      }),
    }),
  });

export const formResources = (t: TFunction) =>
  yup.array().of(
    yup.object().shape({
      name: yup.string().required(t('pipelines-plugin~Required')),
      selection: yup.string().required(t('pipelines-plugin~Required')),
      data: yup.object().when('selection', {
        is: CREATE_PIPELINE_RESOURCE,
        then: validateResourceType(t),
      }),
    }),
  );

const volumeTypeSchema = (t: TFunction) =>
  yup
    .object()
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.Secret,
      then: yup.object().shape({
        secret: yup.object().shape({
          secretName: yup.string().required(t('pipelines-plugin~Required')),
          items: yup.array().of(
            yup.object().shape({
              key: yup.string().required(t('pipelines-plugin~Required')),
              path: yup.string().required(t('pipelines-plugin~Required')),
            }),
          ),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.ConfigMap,
      then: yup.object().shape({
        configMap: yup.object().shape({
          name: yup.string().required(t('pipelines-plugin~Required')),
          items: yup.array().of(
            yup.object().shape({
              key: yup.string().required(t('pipelines-plugin~Required')),
              path: yup.string().required(t('pipelines-plugin~Required')),
            }),
          ),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.PVC,
      then: yup.object().shape({
        persistentVolumeClaim: yup.object().shape({
          claimName: yup.string().required(t('pipelines-plugin~Required')),
        }),
      }),
    });

const commonPipelineSchema = (t: TFunction) =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('pipelines-plugin~Required')),
        default: yup.string(),
        description: yup.string(),
        value: yup
          .string()
          .test('test-if-param-can-be-empty', t('pipelines-plugin~Required'), function(
            value: string,
          ) {
            return taskParamIsRequired(this.parent) ? !!value : true;
          }),
      }),
    ),
    resources: formResources(t),
    workspaces: yup.array().of(
      yup.object().shape({
        type: yup.string().required(t('pipelines-plugin~Required')),
        data: volumeTypeSchema(t),
      }),
    ),
  });

export const startPipelineSchema = (t: TFunction) =>
  commonPipelineSchema(t).shape({
    secretOpen: yup.boolean().equals([false]),
  });

export const addTriggerSchema = (t: TFunction) =>
  commonPipelineSchema(t).shape({
    triggerBinding: yup.object().shape({
      name: yup.string().required(t('pipelines-plugin~Required')),
      resource: yup
        .object()
        .shape({
          metadata: yup.object().shape({
            name: yup.string().required(t('pipelines-plugin~Required')),
          }),
        })
        .required(t('pipelines-plugin~Required')),
    }),
  });

export const advancedSectionValidationSchema = (t: TFunction) =>
  yup.object().shape({
    secretName: yup.string().required(t('pipelines-plugin~Required')),
    type: yup.string().required(t('pipelines-plugin~Required')),
    annotations: yup.object().shape({
      key: yup.string().required(t('pipelines-plugin~Required')),
      value: yup.string().required(t('pipelines-plugin~Required')),
    }),
  });
