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
} from './validation-schema';

export const deployValidationSchema = yup.object().shape({
  project: projectNameValidationSchema,
  application: applicationNameValidationSchema,
  name: nameValidationSchema,
  isi: isiValidationSchema,
  serverless: serverlessValidationSchema,
  deployment: deploymentValidationSchema,
  route: routeValidationSchema,
  limits: limitsValidationSchema,
});
