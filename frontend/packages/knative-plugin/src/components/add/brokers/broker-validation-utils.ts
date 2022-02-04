import * as yup from 'yup';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export const brokerValidationSchema = () =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: yup.object().shape({
        project: projectNameValidationSchema,
        application: applicationNameValidationSchema,
        name: nameValidationSchema(),
      }),
    }),
    yamlData: yup.string(),
  });
