import * as yup from 'yup';
import {
  nameValidationSchema,
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { EventSources } from './import-types';
import { isKnownEventSource } from '../../utils/create-eventsources-utils';

const sinkServiceSchema = yup.object().shape({
  knativeService: yup.string().required('Required'),
});

export const sourceDataSpecSchema = yup
  .object()
  .when('type', {
    is: EventSources.CronJobSource,
    then: yup.object().shape({
      cronjobsource: yup.object().shape({
        data: yup.string().max(253, 'Cannot be longer than 253 characters.'),
        schedule: yup
          .string()
          .max(253, 'Cannot be longer than 253 characters.')
          .required('Required'),
      }),
    }),
  })
  .when('type', {
    is: EventSources.PingSource,
    then: yup.object().shape({
      pingsource: yup.object().shape({
        data: yup.string().max(253, 'Cannot be longer than 253 characters.'),
        schedule: yup
          .string()
          .max(253, 'Cannot be longer than 253 characters.')
          .required('Required'),
      }),
    }),
  })
  .when('type', {
    is: EventSources.SinkBinding,
    then: yup.object().shape({
      sinkbinding: yup.object().shape({
        subject: yup.object().shape({
          selector: yup.object().shape({
            matchLabels: yup.object(),
          }),
          apiVersion: yup
            .string()
            .max(253, 'Cannot be longer than 253 characters.')
            .required('Required'),
          kind: yup
            .string()
            .max(253, 'Cannot be longer than 253 characters.')
            .required('Required'),
        }),
      }),
    }),
  })
  .when('type', {
    is: EventSources.ApiServerSource,
    then: yup.object().shape({
      apiserversource: yup.object().shape({
        resources: yup
          .array()
          .of(
            yup.object({
              apiVersion: yup.string().required('Required'),
              kind: yup.string().required('Required'),
            }),
          )
          .required('Required'),
      }),
    }),
  })
  .when('type', {
    is: EventSources.KafkaSource,
    then: yup.object().shape({
      kafkasource: yup.object().shape({
        bootstrapServers: yup.array().of(yup.string().required('Required')),
        consumerGroup: yup.string().required('Required'),
        topics: yup.array().of(yup.string().required('Required')),
        net: yup.object().shape({
          sasl: yup.object().shape({
            enable: yup.boolean(),
            user: yup.object().when('enable', {
              is: true,
              then: yup.object().shape({
                secretKeyRef: yup.object().shape({
                  name: yup.string().required('Required'),
                  key: yup.string().required('Required'),
                }),
              }),
            }),
            password: yup.object().when('enable', {
              is: true,
              then: yup.object().shape({
                secretKeyRef: yup.object().shape({
                  name: yup.string().required('Required'),
                  key: yup.string().required('Required'),
                }),
              }),
            }),
          }),
          tls: yup.object().shape({
            enable: yup.boolean(),
            caCert: yup.object().when('enable', {
              is: true,
              then: yup.object().shape({
                secretKeyRef: yup.object().shape({
                  name: yup.string().required('Required'),
                  key: yup.string().required('Required'),
                }),
              }),
            }),
            cert: yup.object().when('enable', {
              is: true,
              then: yup.object().shape({
                secretKeyRef: yup.object().shape({
                  name: yup.string().required('Required'),
                  key: yup.string().required('Required'),
                }),
              }),
            }),
            key: yup.object().when('enable', {
              is: true,
              then: yup.object().shape({
                secretKeyRef: yup.object().shape({
                  name: yup.string().required('Required'),
                  key: yup.string().required('Required'),
                }),
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
      containersource: yup.object().shape({
        template: yup.object({
          spec: yup.object({
            containers: yup.array().of(
              yup.object({
                image: yup.string().required('Required'),
              }),
            ),
          }),
        }),
      }),
    }),
  });

export const eventSourceValidationSchema = yup.lazy((formData) => {
  if (isKnownEventSource(formData.type)) {
    return yup.object().shape({
      project: projectNameValidationSchema,
      application: applicationNameValidationSchema,
      name: nameValidationSchema,
      sink: sinkServiceSchema,
      data: sourceDataSpecSchema,
    });
  }
  return yup.object().shape({
    yamlData: yup.string(),
  });
});
