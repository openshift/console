import { TFunction } from 'i18next';
import * as yup from 'yup';
import { PipelineResourceType, VolumeTypes } from '../../const';
import { CREATE_PIPELINE_RESOURCE } from './const';

export const validateResourceType = (t: TFunction) =>
  yup.object().shape({
    type: yup.string().required(t('devconsole~Required')),
    params: yup
      .object()
      .when('type', {
        is: PipelineResourceType.git,
        then: yup.object({
          url: yup.string().required(t('devconsole~Required')),
          revision: yup.string(),
        }),
      })
      .when('type', {
        is: PipelineResourceType.image,
        then: yup.object({
          url: yup.string().required(t('devconsole~Required')),
        }),
      })
      .when('type', {
        is: PipelineResourceType.storage,
        then: yup.object({
          type: yup.string().required(t('devconsole~Required')),
          location: yup.string().required(t('devconsole~Required')),
          dir: yup.string(),
        }),
      })
      .when('type', {
        is: PipelineResourceType.cluster,
        then: yup.object({
          name: yup.string().required(t('devconsole~Required')),
          url: yup.string().required(t('devconsole~Required')),
          username: yup.string().required(t('devconsole~Required')),
          password: yup.string(),
          insecure: yup.string(),
        }),
      }),
    secrets: yup.object().when('type', {
      is: PipelineResourceType.cluster,
      then: yup.object({
        cadata: yup.string().required(t('devconsole~Required')),
        token: yup.string(),
      }),
    }),
  });

export const formResources = (t: TFunction) =>
  yup.array().of(
    yup.object().shape({
      name: yup.string().required(t('devconsole~Required')),
      selection: yup.string().required(t('devconsole~Required')),
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
          secretName: yup.string().required(t('devconsole~Required')),
          items: yup.array().of(
            yup.object().shape({
              key: yup.string().required(t('devconsole~Required')),
              path: yup.string().required(t('devconsole~Required')),
            }),
          ),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.ConfigMap,
      then: yup.object().shape({
        configMap: yup.object().shape({
          name: yup.string().required(t('devconsole~Required')),
          items: yup.array().of(
            yup.object().shape({
              key: yup.string().required(t('devconsole~Required')),
              path: yup.string().required(t('devconsole~Required')),
            }),
          ),
        }),
      }),
    })
    .when('type', {
      is: (type) => VolumeTypes[type] === VolumeTypes.PVC,
      then: yup.object().shape({
        persistentVolumeClaim: yup.object().shape({
          claimName: yup.string().required(t('devconsole~Required')),
        }),
      }),
    });

const commonPipelineSchema = (t: TFunction) =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('devconsole~Required')),
        description: yup.string(),
        default: yup.string().required(t('devconsole~Required')),
      }),
    ),
    resources: formResources(t),
    workspaces: yup.array().of(
      yup.object().shape({
        type: yup.string().required(t('devconsole~Required')),
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
      name: yup.string().required(t('devconsole~Required')),
      resource: yup
        .object()
        .shape({
          metadata: yup.object().shape({
            name: yup.string().required(t('devconsole~Required')),
          }),
        })
        .required(t('devconsole~Required')),
    }),
  });

export const advancedSectionValidationSchema = (t: TFunction) =>
  yup.object().shape({
    secretName: yup.string().required(t('devconsole~Required')),
    type: yup.string().required(t('devconsole~Required')),
    annotations: yup.object().shape({
      key: yup.string().required(t('devconsole~Required')),
      value: yup.string().required(t('devconsole~Required')),
    }),
  });
