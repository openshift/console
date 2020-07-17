import * as yup from 'yup';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export const hpaValidationSchema = yup.object({
  editorType: yup.string(),
  formData: yup.object().when('editorType', {
    is: EditorType.Form,
    then: yup.object({
      spec: yup.object({
        minReplicas: yup
          .number()
          .integer('Min Pods must be an integer.')
          .min(1, 'Min Pods must greater than or equal to 1.')
          .test('test-less-than-max', 'Min Pods should be less than Max Pods.', function(
            minReplicas,
          ) {
            const { maxReplicas } = this.parent;
            return minReplicas <= maxReplicas;
          }),
        maxReplicas: yup
          .number()
          .integer('Max Pods must be an integer.')
          .test('test-greater-than-min', 'Max Pods should be greater than Min Pods.', function(
            maxReplicas,
          ) {
            const { minReplicas } = this.parent;
            return minReplicas <= maxReplicas;
          })
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
