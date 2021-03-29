import * as _ from 'lodash';
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
  imageValidationSchema,
  buildValidationSchema,
  resourcesValidationSchema,
} from './validation-schema';
import { healthChecksProbesValidationSchema } from '../health-checks/health-checks-probe-validation-utils';

export const fileNameRegex = /\.(jar)$/i;

export const fileUploadValidationSchema = (t: TFunction) =>
  yup.object().shape({
    name: yup
      .string()
      .matches(fileNameRegex, {
        message: t('devconsole~Must be a JAR file.'),
      })
      .max(253, t('devconsole~Cannot be longer than 253 characters.'))
      .required(t('devconsole~Required')),
    javaArgs: yup.string(),
  });

export const validationSchema = (t: TFunction) =>
  yup.object().shape({
    name: nameValidationSchema(t),
    fileUpload: fileUploadValidationSchema(t),
    project: projectNameValidationSchema,
    application: applicationNameValidationSchema,
    image: imageValidationSchema(t),
    deployment: deploymentValidationSchema(t),
    serverless: serverlessValidationSchema(t),
    route: routeValidationSchema(t),
    limits: limitsValidationSchema(t),
    build: buildValidationSchema,
    resources: resourcesValidationSchema,
    healthChecks: healthChecksProbesValidationSchema(t),
  });

export const getAppName = (name: string) => {
  if (!fileNameRegex.test(name)) {
    return undefined;
  }
  return _.kebabCase(name.split('.').shift());
};
