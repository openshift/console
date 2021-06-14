import { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameValidationSchema } from '@console/shared';
import { HelmActionType } from '../types/helm-types';

export const getHelmActionValidationSchema = (helmAction: HelmActionType, t: TFunction) => {
  switch (helmAction) {
    case HelmActionType.Install:
      return yup.object().shape({
        releaseName: nameValidationSchema(t),
      });
    case HelmActionType.Upgrade:
      return yup.object().shape({
        chartVersion: yup.string().required(t('helm-plugin~Required')),
      });
    default:
      return null;
  }
};
