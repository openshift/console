import * as yup from 'yup';
import { TFunction } from 'i18next';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

const pipelineBuilderFormSchema = (t: TFunction) =>
  yup.object({
    name: yup.string().required(t('pipelines-plugin~Required')),
    params: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
        description: yup.string(),
        default: yup.string(),
      }),
    ),
    resources: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
        type: yup.string().required(t('pipelines-plugin~Required')),
      }),
    ),
    tasks: yup
      .array()
      .of(
        yup.object({
          name: yup.string().required(t('pipelines-plugin~Required')),
          runAfter: yup.array().of(yup.string()),
          taskRef: yup
            .object({
              name: yup.string().required(t('pipelines-plugin~Required')),
              kind: yup.string(),
            })
            .required(t('pipelines-plugin~Required')),
        }),
      )
      .min(1, t('pipelines-plugin~Must define at least one task'))
      .required(t('pipelines-plugin~Required')),
    taskList: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
        runAfter: yup.string(),
      }),
    ),
  });

export const validationSchema = (t: TFunction) =>
  yup.object({
    editorType: yup.string(),
    yamlData: yup.string().when('editorType', {
      is: EditorType.YAML,
      then: yup.string().required(),
    }),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: pipelineBuilderFormSchema(t),
    }),
  });
