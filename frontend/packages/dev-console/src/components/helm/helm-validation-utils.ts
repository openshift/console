import { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameValidationSchema } from '../import/validation-schema';
import { HelmActionType } from './helm-types';

export const getHelmActionValidationSchema = (helmAction: HelmActionType, t: TFunction) => {
  switch (helmAction) {
    case HelmActionType.Install:
      return yup.object().shape({
        releaseName: nameValidationSchema,
      });
    case HelmActionType.Upgrade:
      return yup.object().shape({
        chartVersion: yup.string().required(t('devconsole~Required')),
      });
    default:
      return null;
  }
};
