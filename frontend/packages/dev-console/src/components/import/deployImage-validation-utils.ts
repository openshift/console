import * as yup from 'yup';
import { TFunction } from 'i18next';
import { nameValidationSchema } from '@console/shared';
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
import { healthChecksProbesValidationSchema } from '../health-checks/health-checks-probe-validation-utils';

export const deployValidationSchema = (t: TFunction) =>
  yup.object().shape({
    project: projectNameValidationSchema,
    application: applicationNameValidationSchema,
    name: nameValidationSchema(t),
    isi: isiValidationSchema(t),
    serverless: serverlessValidationSchema(t),
    deployment: deploymentValidationSchema(t),
    route: routeValidationSchema(t),
    limits: limitsValidationSchema(t),
    resources: resourcesValidationSchema,
    healthChecks: healthChecksProbesValidationSchema(t),
  });
