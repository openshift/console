import * as yup from 'yup';
import { PipelineResourceType, VolumeTypes } from '../../const';
import { CREATE_PIPELINE_RESOURCE } from './const';

export const validateResourceType = yup.object().shape({
  type: yup.string().required('Required'),
  params: yup
    .object()
    .when('type', {
      is: PipelineResourceType.git,
      then: yup.object({
        url: yup.string().required('Required'),
        revision: yup.string(),
      }),
    })
    .when('type', {
      is: PipelineResourceType.image,
      then: yup.object({
        url: yup.string().required('Required'),
      }),
    })
    .when('type', {
      is: PipelineResourceType.storage,
      then: yup.object({
        type: yup.string().required('Required'),
        location: yup.string().required('Required'),
        dir: yup.string(),
      }),
    })
    .when('type', {
      is: PipelineResourceType.cluster,
      then: yup.object({
        name: yup.string().required('Required'),
        url: yup.string().required('Required'),
        username: yup.string().required('Required'),
        password: yup.string(),
        insecure: yup.string(),
      }),
    }),
  secrets: yup.object().when('type', {
    is: PipelineResourceType.cluster,
    then: yup.object({
      cadata: yup.string().required('Required'),
      token: yup.string(),
    }),
  }),
});

export const formResources = yup.array().of(
  yup.object().shape({
    name: yup.string().required('Required'),
    selection: yup.string().required('Required'),
    data: yup.object().when('selection', {
      is: CREATE_PIPELINE_RESOURCE,
      then: validateResourceType,
    }),
  }),
);

const volumeTypeSchema = yup
  .object()
  .when('type', {
    is: (type) => VolumeTypes[type] === VolumeTypes.Secret,
    then: yup.object().shape({
      secret: yup.object().shape({
        secretName: yup.string().required('Required'),
        items: yup.array().of(
          yup.object().shape({
            key: yup.string().required('Required'),
            path: yup.string().required('Required'),
          }),
        ),
      }),
    }),
  })
  .when('type', {
    is: (type) => VolumeTypes[type] === VolumeTypes.ConfigMap,
    then: yup.object().shape({
      configMap: yup.object().shape({
        name: yup.string().required('Required'),
        items: yup.array().of(
          yup.object().shape({
            key: yup.string().required('Required'),
            path: yup.string().required('Required'),
          }),
        ),
      }),
    }),
  })
  .when('type', {
    is: (type) => VolumeTypes[type] === VolumeTypes.PVC,
    then: yup.object().shape({
      persistentVolumeClaim: yup.object().shape({
        claimName: yup.string().required('Required'),
      }),
    }),
  });

const commonPipelineSchema = yup.object().shape({
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      description: yup.string(),
      default: yup.string().required('Required'),
    }),
  ),
  resources: formResources,
});

export const startPipelineSchema = commonPipelineSchema.shape({
  workspaces: yup.array().of(
    yup.object().shape({
      type: yup.string().required('Required'),
      data: volumeTypeSchema,
    }),
  ),
  secretOpen: yup.boolean().equals([false]),
});

export const addTriggerSchema = commonPipelineSchema.shape({
  triggerBinding: yup.object().shape({
    name: yup.string().required('Required'),
    resource: yup
      .object()
      .shape({
        metadata: yup.object().shape({
          name: yup.string().required('Required'),
        }),
      })
      .required('Required'),
  }),
});

export const advancedSectionValidationSchema = yup.object().shape({
  secretName: yup.string().required('Required'),
  type: yup.string().required('Required'),
  annotations: yup.object().shape({
    key: yup.string().required('Required'),
    value: yup.string().required('Required'),
  }),
});
