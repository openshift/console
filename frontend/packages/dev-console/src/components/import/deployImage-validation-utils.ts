import * as yup from 'yup';
import {
  nameValidationSchema,
  projectNameValidationSchema,
  applicationNameValidationSchema,
  deploymentValidationSchema,
  serverlessValidationSchema,
  limitsValidationSchema,
  routeValidationSchema,
  isiValidationSchema,
  resourcesValidationSchema,
} from './validation-schema';
import { healthChecksProbesValidationSchema } from '@console/app/src/components/health-checks/health-checks-probe-validation-utils';

export const deployValidationSchema = yup.object().shape({
  project: projectNameValidationSchema,
  application: applicationNameValidationSchema,
  name: nameValidationSchema,
  isi: isiValidationSchema,
  serverless: serverlessValidationSchema,
  deployment: deploymentValidationSchema,
  route: routeValidationSchema,
  limits: limitsValidationSchema,
  resources: resourcesValidationSchema,
  healthChecks: healthChecksProbesValidationSchema,
});
