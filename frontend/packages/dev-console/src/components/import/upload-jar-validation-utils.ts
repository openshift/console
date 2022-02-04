import i18next from 'i18next';
import * as _ from 'lodash';
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
  imageValidationSchema,
  buildValidationSchema,
  resourcesValidationSchema,
} from './validation-schema';

export const fileNameRegex = /\.(jar)$/i;

export const fileUploadValidationSchema = () =>
  yup.object().shape({
    name: yup
      .string()
      .matches(fileNameRegex, {
        message: i18next.t('devconsole~Must be a JAR file.'),
      })
      .max(253, i18next.t('devconsole~Cannot be longer than 253 characters.'))
      .required(i18next.t('devconsole~Required')),
    javaArgs: yup.string(),
  });

export const validationSchema = () =>
  yup.object().shape({
    name: nameValidationSchema(),
    fileUpload: fileUploadValidationSchema(),
    project: projectNameValidationSchema,
    application: applicationNameValidationSchema,
    image: imageValidationSchema(),
    deployment: deploymentValidationSchema(),
    serverless: serverlessValidationSchema(),
    route: routeValidationSchema(),
    limits: limitsValidationSchema(),
    build: buildValidationSchema,
    resources: resourcesValidationSchema,
    healthChecks: healthChecksProbesValidationSchema(),
  });

export const getAppName = (name: string) => {
  if (!fileNameRegex.test(name)) {
    return undefined;
  }
  return _.kebabCase(name.split('.').shift());
};
