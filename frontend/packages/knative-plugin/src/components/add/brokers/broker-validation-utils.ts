import type { TFunction } from 'i18next';
import * as yup from 'yup';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export const brokerValidationSchema = (t: TFunction) =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: (schema) =>
        schema.shape({
          project: projectNameValidationSchema,
          application: applicationNameValidationSchema,
          name: nameValidationSchema(t),
        }),
      otherwise: (schema) => schema,
    }),
    yamlData: yup.string(),
  });
