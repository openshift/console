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

export const deployValidationSchema = () =>
  yup.object().shape({
    project: projectNameValidationSchema,
    application: applicationNameValidationSchema,
    name: nameValidationSchema(),
    isi: isiValidationSchema(),
    serverless: serverlessValidationSchema(),
    deployment: deploymentValidationSchema(),
    route: routeValidationSchema(),
    limits: limitsValidationSchema(),
    resources: resourcesValidationSchema,
    healthChecks: healthChecksProbesValidationSchema(),
  });
