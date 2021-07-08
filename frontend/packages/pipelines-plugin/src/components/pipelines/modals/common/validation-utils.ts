import i18next from 'i18next';
import * as yup from 'yup';
import { paramIsRequired } from '../../../../utils/common';
import { PipelineResourceType, VolumeTypes } from '../../const';
import { CREATE_PIPELINE_RESOURCE } from './const';

export const validateResourceType = () =>
  yup.object().shape({
    type: yup.string().required(i18next.t('pipelines-plugin~Required')),
    params: yup
      .object()
      .when('type', {
        is: PipelineResourceType.git,
        then: yup.object({
          url: yup.string().required(i18next.t('pipelines-plugin~Required')),
          revision: yup.string(),
        }),
      })
      .when('type', {
        is: PipelineResourceType.image,
        then: yup.object({
          url: yup.string().required(i18next.t('pipelines-plugin~Required')),
        }),
      })
      .when('type', {
        is: PipelineResourceType.storage,
        then: yup.object({
          type: yup.string().required(i18next.t('pipelines-plugin~Required')),
          location: yup.string().required(i18next.t('pipelines-plugin~Required')),
          dir: yup.string(),
        }),
      })
      .when('type', {
        is: PipelineResourceType.cluster,
        then: yup.object({
          name: yup.string().required(i18next.t('pipelines-plugin~Required')),
          url: yup.string().required(i18next.t('pipelines-plugin~Required')),
          username: yup.string().required(i18next.t('pipelines-plugin~Required')),
          password: yup.string(),
          insecure: yup.string(),
        }),
      }),
    secrets: yup.object().when('type', {
      is: PipelineResourceType.cluster,
      then: yup.object({
        cadata: yup.string().required(i18next.t('pipelines-plugin~Required')),
        token: yup.string(),
      }),
    }),
  });

export const formResources = () =>
  yup.array().of(
    yup.object().shape({
      name: yup.string().required(i18next.t('pipelines-plugin~Required')),
      selection: yup.string().required(i18next.t('pipelines-plugin~Required')),
      data: yup.object().when('selection', {
        is: CREATE_PIPELINE_RESOURCE,
        then: validateResourceType(),
      }),
    }),
  );

const volumeTypeSchema = () =>
  yup
    .object()
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.Secret,
      then: yup.object().shape({
        secret: yup.object().shape({
          secretName: yup.string().required(i18next.t('pipelines-plugin~Required')),
          items: yup.array().of(
            yup.object().shape({
              key: yup.string().required(i18next.t('pipelines-plugin~Required')),
              path: yup.string().required(i18next.t('pipelines-plugin~Required')),
            }),
          ),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.ConfigMap,
      then: yup.object().shape({
        configMap: yup.object().shape({
          name: yup.string().required(i18next.t('pipelines-plugin~Required')),
          items: yup.array().of(
            yup.object().shape({
              key: yup.string().required(i18next.t('pipelines-plugin~Required')),
              path: yup.string().required(i18next.t('pipelines-plugin~Required')),
            }),
          ),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.PVC,
      then: yup.object().shape({
        persistentVolumeClaim: yup.object().shape({
          claimName: yup.string().required(i18next.t('pipelines-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.VolumeClaimTemplate,
      then: yup.object().shape({
        volumeClaimTemplate: yup.object().shape({
          spec: yup.object().shape({
            accessModes: yup
              .array()
              .of(yup.string().required(i18next.t('pipelines-plugin~Required'))),
            resources: yup.object().shape({
              requests: yup
                .object()
                .shape({ storage: yup.string().required(i18next.t('pipelines-plugin~Required')) }),
            }),
            storageClassName: yup.string().required(i18next.t('pipelines-plugin~Required')),
            volumeMode: yup.string().required(i18next.t('pipelines-plugin~Required')),
          }),
        }),
      }),
    });

const commonPipelineSchema = () =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(i18next.t('pipelines-plugin~Required')),
        default: yup.string(),
        description: yup.string(),
        value: yup
          .string()
          .test('test-if-param-can-be-empty', i18next.t('pipelines-plugin~Required'), function(
            value: string,
          ) {
            return paramIsRequired(this.parent) ? !!value : true;
          }),
      }),
    ),
    resources: formResources(),
    workspaces: yup.array().of(
      yup.object().shape({
        type: yup.string().required(i18next.t('pipelines-plugin~Required')),
        data: volumeTypeSchema(),
      }),
    ),
  });

export const startPipelineSchema = () =>
  commonPipelineSchema().shape({
    secretOpen: yup.boolean().equals([false]),
  });

export const addTriggerSchema = () =>
  commonPipelineSchema().shape({
    triggerBinding: yup.object().shape({
      name: yup.string().required(i18next.t('pipelines-plugin~Required')),
      resource: yup
        .object()
        .shape({
          metadata: yup.object().shape({
            name: yup.string().required(i18next.t('pipelines-plugin~Required')),
          }),
        })
        .required(i18next.t('pipelines-plugin~Required')),
    }),
  });

export const advancedSectionValidationSchema = () =>
  yup.object().shape({
    secretName: yup.string().required(i18next.t('pipelines-plugin~Required')),
    type: yup.string().required(i18next.t('pipelines-plugin~Required')),
    annotations: yup.object().shape({
      key: yup.string().required(i18next.t('pipelines-plugin~Required')),
      value: yup.string().required(i18next.t('pipelines-plugin~Required')),
    }),
  });
