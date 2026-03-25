import type { TFunction } from 'i18next';
import * as yup from 'yup';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { isValidUrl, nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EventSources, SinkType } from './import-types';

export const sinkTypeUriValidation = (t: TFunction) =>
  yup.object().shape({
    uri: yup
      .string()
      .max(2000, t('knative-plugin~Please enter a URI that is less then 2000 characters.'))
      .test('validate-uri', t('knative-plugin~Invalid URI.'), function (value) {
        return isValidUrl(value);
      })
      .required(t('knative-plugin~Required')),
  });

const sinkServiceSchema = (t: TFunction) =>
  yup
    .object()
    .when('sinkType', {
      is: SinkType.Resource,
      then: (schema) =>
        schema.shape({
          name: yup.string().required(t('knative-plugin~Required')),
        }),
      otherwise: (schema) => schema,
    })
    .when('sinkType', {
      is: SinkType.Uri,
      then: (schema) => schema.concat(sinkTypeUriValidation(t)),
      otherwise: (schema) => schema,
    });

export const sourceDataSpecSchema = (t: TFunction) =>
  yup
    .object()
    .when('type', {
      is: EventSources.PingSource,
      then: (schema) =>
        schema.shape({
          [EventSources.PingSource]: yup.object().shape({
            data: yup.string().max(253, t('knative-plugin~Cannot be longer than 253 characters.')),
            schedule: yup
              .string()
              .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
              .required(t('knative-plugin~Required')),
          }),
        }),
      otherwise: (schema) => schema,
    })
    .when('type', {
      is: EventSources.SinkBinding,
      then: (schema) =>
        schema.shape({
          [EventSources.SinkBinding]: yup.object().shape({
            subject: yup.object().shape({
              selector: yup.object().shape({
                matchLabels: yup.object(),
              }),
              name: yup.string().when('selector.matchLabels', {
                is: (obj: object) => !obj,
                then: (nameSchema) => nameSchema.required(t('knative-plugin~Required')),
                otherwise: (nameSchema) => nameSchema,
              }),
              apiVersion: yup
                .string()
                .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
                .required(t('knative-plugin~Required')),
              kind: yup
                .string()
                .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
                .required(t('knative-plugin~Required')),
            }),
          }),
        }),
      otherwise: (schema) => schema,
    })
    .when('type', {
      is: EventSources.ApiServerSource,
      then: (schema) =>
        schema.shape({
          [EventSources.ApiServerSource]: yup.object().shape({
            resources: yup
              .array()
              .of(
                yup.object({
                  apiVersion: yup.string().required(t('knative-plugin~Required')),
                  kind: yup.string().required(t('knative-plugin~Required')),
                }),
              )
              .required(t('knative-plugin~Required')),
          }),
        }),
      otherwise: (schema) => schema,
    })
    .when('type', {
      is: EventSources.KafkaSource,
      then: (schema) =>
        schema.shape({
          [EventSources.KafkaSource]: yup.object().shape({
            bootstrapServers: yup.array().of(yup.string()).min(1, t('knative-plugin~Required')),
            consumerGroup: yup.string().required(t('knative-plugin~Required')),
            topics: yup.array().of(yup.string()).min(1, t('knative-plugin~Required')),
            net: yup.object().shape({
              sasl: yup.object().shape({
                enable: yup.boolean(),
                user: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string(),
                    key: yup.string(),
                  }),
                }),
                password: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string(),
                    key: yup.string(),
                  }),
                }),
              }),
              tls: yup.object().shape({
                enable: yup.boolean(),
                caCert: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string(),
                    key: yup.string(),
                  }),
                }),
                cert: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string(),
                    key: yup.string(),
                  }),
                }),
                key: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string(),
                    key: yup.string(),
                  }),
                }),
              }),
            }),
          }),
        }),
      otherwise: (schema) => schema,
    })
    .when('type', {
      is: EventSources.ContainerSource,
      then: (schema) =>
        schema.shape({
          [EventSources.ContainerSource]: yup.object().shape({
            template: yup.object({
              spec: yup.object({
                containers: yup.array().of(
                  yup.object({
                    image: yup.string().required(t('knative-plugin~Required')),
                  }),
                ),
              }),
            }),
          }),
        }),
      otherwise: (schema) => schema,
    });

export const eventSourceValidationSchema = (t: TFunction) =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: (schema) =>
        schema.shape({
          project: projectNameValidationSchema,
          application: applicationNameValidationSchema,
          name: nameValidationSchema(t),
          sink: sinkServiceSchema(t),
          data: sourceDataSpecSchema(t),
        }),
      otherwise: (schema) => schema,
    }),
    yamlData: yup.string(),
  });

export const addChannelValidationSchema = (t: TFunction) =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: (schema) =>
        schema.shape({
          project: projectNameValidationSchema,
          application: applicationNameValidationSchema,
          name: nameValidationSchema(t),
          data: yup.object(),
          type: yup.string(),
        }),
      otherwise: (schema) => schema,
    }),
    yamlData: yup.string(),
  });
