import type { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameRegex } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { isInteger } from '../../utils/yup-validation-util';

export const hpaValidationSchema = (t: TFunction) =>
  yup.object({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: (schema) =>
        schema.shape({
          metadata: yup.object({
            name: yup
              .string()
              .matches(nameRegex, {
                message: t(
                  'devconsole~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
                ),
                excludeEmptyString: true,
              })
              .max(253, t('devconsole~Cannot be longer than 253 characters.'))
              .required(t('devconsole~Required')),
          }),
          spec: yup.object({
            minReplicas: yup
              .number()
              .test(isInteger(t('devconsole~Minimum Pods must be an integer.')))
              .min(1, t('devconsole~Minimum Pods must greater than or equal to 1.'))
              .test(
                'test-less-than-max',
                t('devconsole~Minimum Pods should be less than or equal to Maximum Pods.'),
                function (minReplicas) {
                  const { maxReplicas } = this.parent;
                  return minReplicas <= maxReplicas;
                },
              ),
            maxReplicas: yup
              .number()
              .test(isInteger(t('devconsole~Maximum Pods must be an integer.')))
              .max(
                Number.MAX_SAFE_INTEGER,
                t('devconsole~Value is larger than maximum value allowed.'),
              )
              .test(
                'test-greater-than-min',
                t('devconsole~Maximum Pods should be greater than or equal to Minimum Pods.'),
                function (maxReplicas) {
                  const { minReplicas } = this.parent;
                  return minReplicas <= maxReplicas;
                },
              )
              .required(t('devconsole~Max Pods must be defined.')),
          }),
        }),
      otherwise: (schema) => schema,
    }),
  });
