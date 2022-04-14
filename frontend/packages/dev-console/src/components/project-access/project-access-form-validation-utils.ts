import * as yup from 'yup';
import i18n from '@console/internal/i18n';

export const validationSchema = yup.object().shape({
  namespace: yup.string().required(i18n.t('devconsole~Required')),
  projectAccess: yup.array().of(
    yup.object().shape({
      user: yup.string().required(i18n.t('devconsole~Required')),
      role: yup.string().required(i18n.t('devconsole~Required')),
    }),
  ),
});
