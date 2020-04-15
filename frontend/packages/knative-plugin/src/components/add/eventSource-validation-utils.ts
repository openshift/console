import * as yup from 'yup';
import {
  nameValidationSchema,
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { EventSources } from './import-types';

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
        bootstrapServers: yup.string().required('Required'),
        consumerGroup: yup.string().required('Required'),
        topics: yup.string().required('Required'),
      }),
    }),
  })
  .when('type', {
    is: EventSources.ContainerSource,
    then: yup.object().shape({
      containersource: yup.object().shape({
        containers: yup.array().of(
          yup.object({
            image: yup.string().required('Required'),
          }),
        ),
      }),
    }),
  });
export const eventSourceValidationSchema = yup.object().shape({
  project: projectNameValidationSchema,
  application: applicationNameValidationSchema,
  name: nameValidationSchema,
  sink: sinkServiceSchema,
  data: sourceDataSpecSchema,
});
