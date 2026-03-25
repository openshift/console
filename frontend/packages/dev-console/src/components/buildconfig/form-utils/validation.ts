import * as yup from 'yup';
import i18n from '@console/internal/i18n';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import type { BuildConfigFormikValues } from './types';

const nameSchema = () => yup.string().required(i18n.t('devconsole~Required'));

const sourceSchema = () =>
  yup
    .object({
      type: yup
        .string()
        .required(i18n.t('devconsole~Required'))
        .oneOf(['git', 'dockerfile', 'binary']),
      git: yup.object().when('type', {
        is: 'git',
        then: (schema) =>
          schema.shape({
            git: yup.object({
              url: yup.string().required(i18n.t('devconsole~Required')),
              ref: yup.string(),
              dir: yup.string(),
            }),
          }),
        otherwise: (schema) => schema,
      }),
      dockerfile: yup.string().when('type', {
        is: 'dockerfile',
        then: (schema) => schema,
        otherwise: (schema) => schema,
      }),
    })
    .required(i18n.t('devconsole~Required'));

const imageSchema = (allowedTypes: string[]) =>
  yup.object({
    type: yup.string().required(i18n.t('devconsole~Required')).oneOf(allowedTypes),
    imageStreamTag: yup.object().when('type', {
      is: 'imageStreamTag',
      then: (schema) =>
        schema.shape({
          imageStream: yup.object({
            namespace: yup.string().required(i18n.t('devconsole~Required')),
            image: yup.string().required(i18n.t('devconsole~Required')),
            tag: yup.string().required(i18n.t('devconsole~Required')),
          }),
        }),
      otherwise: (schema) => schema,
    }),
    imageStreamImage: yup.string().when('type', {
      is: 'imageStreamImage',
      then: (schema) => schema.required(i18n.t('devconsole~Required')),
      otherwise: (schema) => schema,
    }),
    dockerImage: yup.string().when('type', {
      is: 'dockerImage',
      then: (schema) => schema.required(i18n.t('devconsole~Required')),
      otherwise: (schema) => schema,
    }),
  });

const imagesSchema = () =>
  yup.object({
    buildFrom: imageSchema(['imageStreamTag', 'imageStreamImage', 'dockerImage']),
    pushTo: imageSchema(['none', 'imageStreamTag', 'imageStreamImage', 'dockerImage']),
  });

const environmentVariablesSchema = () => yup.array();

const triggersSchema = () => yup.object();

const secretsSchema = () => yup.array();

const policySchema = () => yup.object();

const hooksSchema = () => yup.object();

const formDataSchema = () =>
  yup.object({
    name: nameSchema(),
    source: sourceSchema(),
    images: imagesSchema(),
    environmentVariables: environmentVariablesSchema(),
    triggers: triggersSchema(),
    secrets: secretsSchema(),
    policy: policySchema(),
    hooks: hooksSchema(),
  });

export const validationSchema = () =>
  yup.mixed().test({
    async test(values: BuildConfigFormikValues) {
      const formYamlDefinition = yup.object({
        editorType: yup
          .string()
          .oneOf(Object.values(EditorType))
          .required(i18n.t('devconsole~Required')),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: (schema) => schema.concat(formDataSchema()),
          otherwise: (schema) => schema,
        }),
        yamlData: yup.mixed().when('editorType', {
          is: EditorType.YAML,
          then: (schema) => schema.concat(yup.string().required(i18n.t('devconsole~Required'))),
          otherwise: (schema) => schema,
        }),
      });

      await formYamlDefinition.validate(values, { abortEarly: false });
      return true;
    },
  });
