import { TFunction } from 'i18next';
import * as yup from 'yup';

export const validationSchema = (t: TFunction) =>
  yup.object({
    name: yup.string().required(t('devconsole~Required')),
    params: yup.array().of(
      yup.object({
        name: yup.string().required(t('devconsole~Required')),
        description: yup.string(),
        default: yup.string(),
      }),
    ),
    resources: yup.array().of(
      yup.object({
        name: yup.string().required(t('devconsole~Required')),
        type: yup.string().required(t('devconsole~Required')),
      }),
    ),
    tasks: yup
      .array()
      .of(
        yup.object({
          name: yup.string().required(t('devconsole~Required')),
          runAfter: yup.array().of(yup.string()),
          taskRef: yup
            .object({
              name: yup.string().required(t('devconsole~Required')),
              kind: yup.string(),
            })
            .required(t('devconsole~Required')),
        }),
      )
      .min(1, t('devconsole~Must define at least one task'))
      .required(t('devconsole~Required')),
    taskList: yup.array().of(
      yup.object({
        name: yup.string().required(t('devconsole~Required')),
        runAfter: yup.string(),
      }),
    ),
  });
