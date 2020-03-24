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

export const cronJobSpecSchema = yup.object().when('type', {
  is: EventSources.CronJobSource,
  then: yup.object().shape({
    cronjobsource: yup.object().shape({
      data: yup
        .string()
        .max(253, 'Cannot be longer than 253 characters.')
        .required('Required'),
      schedule: yup
        .string()
        .max(253, 'Cannot be longer than 253 characters.')
        .required('Required'),
    }),
  }),
});

export const eventSourceValidationSchema = yup.object().shape({
  project: projectNameValidationSchema,
  application: applicationNameValidationSchema,
  name: nameValidationSchema,
  sink: sinkServiceSchema,
  data: cronJobSpecSchema,
});
