import type { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameValidationSchema } from '@console/shared';
import { healthChecksProbesValidationSchema } from '../health-checks/health-checks-probe-validation-utils';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
  deploymentValidationSchema,
  serverlessValidationSchema,
  limitsValidationSchema,
  routeValidationSchema,
  isiValidationSchema,
  resourcesValidationSchema,
} from './validation-schema';

export const deployValidationSchema = (t: TFunction) =>
  yup.object().shape({
    project: projectNameValidationSchema,
    application: applicationNameValidationSchema,
    name: nameValidationSchema(t),
    isi: yup.object().when('registry', {
      is: 'internal',
      then: (schema) => schema.concat(isiValidationSchema(t)),
      otherwise: (schema) => schema,
    }),
    serverless: serverlessValidationSchema(t),
    deployment: deploymentValidationSchema(t),
    route: routeValidationSchema(t),
    limits: limitsValidationSchema(t),
    resources: resourcesValidationSchema,
    healthChecks: healthChecksProbesValidationSchema(t),
  });
