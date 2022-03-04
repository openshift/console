import { TFunction } from 'i18next';
import * as yup from 'yup';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { sinkTypeUriValidation } from './eventSource-validation-utils';
import { SinkType } from './import-types';

const sourceServiceSchema = (t: TFunction) =>
  yup
    .object()
    .when('sourceType', {
      is: SinkType.Resource,
      then: yup.object().shape({
        name: yup.string().required(t('knative-plugin~Required')),
      }),
    })
    .when('sourceType', {
      is: SinkType.Uri,
      then: sinkTypeUriValidation(t),
    });

export const eventSinkValidationSchema = (t: TFunction) =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: yup.object().shape({
        project: projectNameValidationSchema,
        application: applicationNameValidationSchema,
        name: nameValidationSchema(t),
        source: sourceServiceSchema(t),
        data: yup.object(),
      }),
    }),
    yamlData: yup.string(),
  });
