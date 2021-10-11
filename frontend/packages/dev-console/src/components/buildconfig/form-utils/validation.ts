import * as yup from 'yup';
import i18n from '@console/internal/i18n';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { BuildConfigFormikValues } from './types';

const nameSchema = () => yup.string().required(i18n.t('devconsole~Required'));

const sourceSchema = () =>
  yup.object({
    git: yup.object().when('type', {
      is: 'git',
      then: yup.object({
        git: yup.object({
          url: yup.string().required(i18n.t('devconsole~Required')),
          ref: yup.string(),
          dir: yup.string(),
        }),
      }),
    }),
    dockerfile: yup.string().when('type', {
      is: 'dockerfile',
      then: yup.string(),
    }),
  });

const imageSchema = () =>
  yup.object({
    type: yup.string().required(i18n.t('devconsole~Required')),
    imageStreamTag: yup.object().when('type', {
      is: 'imageStreamTag',
      then: yup.object({
        imageStream: yup.object({
          namespace: yup.string().required(i18n.t('devconsole~Required')),
          image: yup.string().required(i18n.t('devconsole~Required')),
          tag: yup.string().required(i18n.t('devconsole~Required')),
        }),
      }),
    }),
    imageStreamImage: yup.string().when('type', {
      is: 'imageStreamImage',
      then: yup.string().required(i18n.t('devconsole~Required')),
    }),
    dockerImage: yup.string().when('type', {
      is: 'dockerImage',
      then: yup.string().required(i18n.t('devconsole~Required')),
    }),
  });

const imagesSchema = () =>
  yup.object({
    buildFrom: imageSchema(),
    pushTo: imageSchema(),
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
    test(values: BuildConfigFormikValues) {
      const formYamlDefinition = yup.object({
        editorType: yup
          .string()
          .oneOf(Object.values(EditorType))
          .required(i18n.t('devconsole~Required')),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: formDataSchema(),
        }),
        yamlData: yup.mixed().when('editorType', {
          is: EditorType.YAML,
          then: yup.string().required(i18n.t('devconsole~Required')),
        }),
      });

      return formYamlDefinition.validate(values, { abortEarly: false });
    },
  });
