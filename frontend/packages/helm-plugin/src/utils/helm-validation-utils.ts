import * as yup from 'yup';
import { TFunction } from 'i18next';
import { nameValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import { HelmActionType } from '../types/helm-types';

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
