import { TFunction } from 'i18next';
import * as yup from 'yup';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { CamelKameletBindingModel, KafkaSinkModel } from '../../models';
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

const sinkDataSpecSchema = (t: TFunction) =>
  yup
    .object()
    .when('type', {
      is: KafkaSinkModel.kind,
      then: yup.object().shape({
        [KafkaSinkModel.kind]: yup.object().shape({
          bootstrapServers: yup
            .array()
            .of(yup.string())
            .min(1, t('knative-plugin~Required')),
          topic: yup.string().required(t('knative-plugin~Required')),
          auth: yup.object().shape({
            secret: yup.object().shape({
              ref: yup.object().shape({
                name: yup.string(),
              }),
            }),
          }),
        }),
      }),
    })
    .when('type', {
      is: CamelKameletBindingModel.kind,
      then: yup.object(),
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
        data: sinkDataSpecSchema(t),
      }),
    }),
    yamlData: yup.string(),
  });
