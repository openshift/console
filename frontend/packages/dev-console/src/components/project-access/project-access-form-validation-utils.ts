import * as yup from 'yup';
import i18n from '@console/internal/i18n';

export const validationSchema = yup.object().shape({
  projectAccess: yup.array().of(
    yup.object().shape({
      subject: yup.object().shape({ name: yup.string().required(i18n.t('devconsole~Required')) }),
      role: yup.string().required(i18n.t('devconsole~Required')),
    }),
  ),
});
