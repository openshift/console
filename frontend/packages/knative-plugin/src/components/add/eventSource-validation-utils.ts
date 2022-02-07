import i18next from 'i18next';
import * as yup from 'yup';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { isValidUrl, nameValidationSchema } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EventSources, SinkType } from './import-types';

export const sinkTypeUriValidation = () =>
  yup.object().shape({
    uri: yup
      .string()
      .max(2000, i18next.t('knative-plugin~Please enter a URI that is less then 2000 characters.'))
      .test('validate-uri', i18next.t('knative-plugin~Invalid URI.'), function(value) {
        return isValidUrl(value);
      })
      .required(i18next.t('knative-plugin~Required')),
  });

const sinkServiceSchema = () =>
  yup
    .object()
    .when('sinkType', {
      is: SinkType.Resource,
      then: yup.object().shape({
        name: yup.string().required(i18next.t('knative-plugin~Required')),
      }),
    })
    .when('sinkType', {
      is: SinkType.Uri,
      then: sinkTypeUriValidation(),
    });

export const sourceDataSpecSchema = () =>
  yup
    .object()
    .when('type', {
      is: EventSources.CronJobSource,
      then: yup.object().shape({
        [EventSources.CronJobSource]: yup.object().shape({
          data: yup
            .string()
            .max(253, i18next.t('knative-plugin~Cannot be longer than 253 characters.')),
          schedule: yup
            .string()
            .max(253, i18next.t('knative-plugin~Cannot be longer than 253 characters.'))
            .required(i18next.t('knative-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: EventSources.PingSource,
      then: yup.object().shape({
        [EventSources.PingSource]: yup.object().shape({
          data: yup
            .string()
            .max(253, i18next.t('knative-plugin~Cannot be longer than 253 characters.')),
          schedule: yup
            .string()
            .max(253, i18next.t('knative-plugin~Cannot be longer than 253 characters.'))
            .required(i18next.t('knative-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: EventSources.SinkBinding,
      then: yup.object().shape({
        [EventSources.SinkBinding]: yup.object().shape({
          subject: yup.object().shape({
            selector: yup.object().shape({
              matchLabels: yup.object(),
            }),
            name: yup.string().when('selector.matchLabels', {
              is: (obj: object) => !obj,
              then: yup.string().required(i18next.t('knative-plugin~Required')),
            }),
            apiVersion: yup
              .string()
              .max(253, i18next.t('knative-plugin~Cannot be longer than 253 characters.'))
              .required(i18next.t('knative-plugin~Required')),
            kind: yup
              .string()
              .max(253, i18next.t('knative-plugin~Cannot be longer than 253 characters.'))
              .required(i18next.t('knative-plugin~Required')),
          }),
        }),
      }),
    })
    .when('type', {
      is: EventSources.ApiServerSource,
      then: yup.object().shape({
        [EventSources.ApiServerSource]: yup.object().shape({
          resources: yup
            .array()
            .of(
              yup.object({
                apiVersion: yup.string().required(i18next.t('knative-plugin~Required')),
                kind: yup.string().required(i18next.t('knative-plugin~Required')),
              }),
            )
            .required(i18next.t('knative-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: EventSources.KafkaSource,
      then: yup.object().shape({
        [EventSources.KafkaSource]: yup.object().shape({
          bootstrapServers: yup
            .array()
            .of(yup.string())
            .min(1, i18next.t('knative-plugin~Required')),
          consumerGroup: yup.string().required(i18next.t('knative-plugin~Required')),
          topics: yup
            .array()
            .of(yup.string())
            .min(1, i18next.t('knative-plugin~Required')),
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
    })
    .when('type', {
      is: EventSources.ContainerSource,
      then: yup.object().shape({
        [EventSources.ContainerSource]: yup.object().shape({
          template: yup.object({
            spec: yup.object({
              containers: yup.array().of(
                yup.object({
                  image: yup.string().required(i18next.t('knative-plugin~Required')),
                }),
              ),
            }),
          }),
        }),
      }),
    });

export const eventSourceValidationSchema = () =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: yup.object().shape({
        project: projectNameValidationSchema,
        application: applicationNameValidationSchema,
        name: nameValidationSchema(),
        sink: sinkServiceSchema(),
        data: sourceDataSpecSchema(),
      }),
    }),
    yamlData: yup.string(),
  });

export const addChannelValidationSchema = () =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: yup.object().shape({
        project: projectNameValidationSchema,
        application: applicationNameValidationSchema,
        name: nameValidationSchema(),
        data: yup.object(),
        type: yup.string(),
      }),
    }),
    yamlData: yup.string(),
  });
