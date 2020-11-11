import * as yup from 'yup';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

const pipelineBuilderFormSchema = yup.object({
  name: yup.string().required('Required'),
  params: yup.array().of(
    yup.object({
      name: yup.string().required('Required'),
      description: yup.string(),
      default: yup.string(),
    }),
  ),
  resources: yup.array().of(
    yup.object({
      name: yup.string().required('Required'),
      type: yup.string().required('Required'),
    }),
  ),
  tasks: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Required'),
        runAfter: yup.array().of(yup.string()),
        taskRef: yup
          .object({
            name: yup.string().required('Required'),
            kind: yup.string(),
          })
          .required('Required'),
      }),
    )
    .min(1, 'Must define at least one task')
    .required('Required'),
  taskList: yup.array().of(
    yup.object({
      name: yup.string().required('Required'),
      runAfter: yup.string(),
    }),
  ),
});

export const validationSchema = yup.object({
  editorType: yup.string(),
  yamlData: yup.string().when('editorType', {
    is: EditorType.YAML,
    then: yup.string().required(),
  }),
  formData: yup.object().when('editorType', {
    is: EditorType.Form,
    then: pipelineBuilderFormSchema,
  }),
});
