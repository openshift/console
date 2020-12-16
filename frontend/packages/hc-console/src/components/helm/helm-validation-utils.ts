import * as yup from 'yup';
import { nameValidationSchema } from '../import/validation-schema';
import { HelmActionType } from './helm-types';

export const getHelmActionValidationSchema = (helmAction: HelmActionType) => {
  switch (helmAction) {
    case HelmActionType.Install:
      return yup.object().shape({
        helmReleaseName: nameValidationSchema,
      });
    case HelmActionType.Upgrade:
      return yup.object().shape({
        chartVersion: yup.string().required('Required'),
      });
    default:
      return null;
  }
};
