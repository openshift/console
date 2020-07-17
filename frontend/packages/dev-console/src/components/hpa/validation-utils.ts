import * as yup from 'yup';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export const hpaValidationSchema = yup.object({
  editorType: yup.string(),
  formData: yup.object().when('editorType', {
    is: EditorType.Form,
    then: yup.object({
      metadata: yup.object({
        name: yup
          .string()
          .matches(/^([a-z]([-a-z0-9]*[a-z0-9])?)*$/, {
            message:
              'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
            excludeEmptyString: true,
          })
          .max(253, 'Cannot be longer than 253 characters.')
          .required('Required'),
      }),
      spec: yup.object({
        minReplicas: yup
          .number()
          .integer('Minimum Pods must be an integer.')
          .min(1, 'Minimum Pods must greater than or equal to 1.')
          .test(
            'test-less-than-max',
            'Minimum Pods should be less than or equal to Maximum Pods.',
            function(minReplicas) {
              const { maxReplicas } = this.parent;
              return minReplicas <= maxReplicas;
            },
          ),
        maxReplicas: yup
          .number()
          .integer('Maximum Pods must be an integer.')
          .test(
            'test-greater-than-min',
            'Maximum Pods should be greater than or equal to Minimum Pods.',
            function(maxReplicas) {
              const { minReplicas } = this.parent;
              return minReplicas <= maxReplicas;
            },
          )
          .required('Max Pods must be defined.'),
        metrics: yup.array(
          yup.object({
            resource: yup.object({
              target: yup.object({
                averageUtilization: yup
                  .mixed()
                  .test(
                    'test-for-valid-utilization',
                    'Average Utilization must be a positive number.',
                    function(avgUtilization) {
                      if (!avgUtilization) return true;
                      return /^\d+$/.test(String(avgUtilization));
                    },
                  ),
              }),
            }),
          }),
        ),
      }),
    }),
  }),
});
