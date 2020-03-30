import * as yup from 'yup';
import { VolumeTypes } from '../const';

export const resourcesValidationSchema = yup.object().shape({
  resources: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      type: yup.string().required('Required'),
    }),
  ),
});

export const parametersValidationSchema = yup.object().shape({
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      description: yup.string(),
      default: yup.string(),
    }),
  ),
});

const volumeTypeSchema = yup
  .object()
  .when('type', {
    is: (type) => VolumeTypes[type] === VolumeTypes.Secret,
    then: yup.object().shape({
      secret: yup.object().shape({
        secretName: yup.string().required('Required'),
        items: yup.array().of(
          yup.object().shape({
            key: yup.string(),
            path: yup.string().when('key', {
              is: (key) => !!key,
              then: yup.string().required('Required'),
            }),
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
            key: yup.string(),
            path: yup.string().when('key', {
              is: (key) => !!key,
              then: yup.string().required('Required'),
            }),
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

export const startPipelineSchema = yup.object().shape({
  resources: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      type: yup.string().required('Required'),
      resourceRef: yup.object().shape({
        name: yup.string().required('Required'),
      }),
    }),
  ),
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      description: yup.string(),
      default: yup.string().required('Required'),
    }),
  ),
  workspaces: yup.array().of(
    yup.object().shape({
      type: yup.string().required('Required'),
      data: volumeTypeSchema,
    }),
  ),
  secretOpen: yup.boolean().equals([false]),
});

export const advancedSectionValidationSchema = yup.object().shape({
  secretName: yup.string().required('Required'),
  type: yup.string().required('Required'),
  annotations: yup.object().shape({
    key: yup.string().required('Required'),
    value: yup.string().required('Required'),
  }),
});
