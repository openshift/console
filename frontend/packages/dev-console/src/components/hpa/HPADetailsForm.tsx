import * as React from 'react';
import { useField, useFormikContext } from 'formik';
import { Alert, AlertActionCloseButton, Flex } from '@patternfly/react-core';
import { InputField, NumberSpinnerField } from '@console/shared';
import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import HPAUtilizationField from './HPAUtilizationField';
import { getMetricByType } from './hpa-utils';
import { HPAFormValues, SupportedMetricTypes } from './types';

const HPADetailsForm: React.FC = () => {
  const name = 'formData';
  const [field] = useField<HorizontalPodAutoscalerKind>(name);
  const { setFieldValue, values } = useFormikContext<HPAFormValues>();

  const updateField = (type: SupportedMetricTypes) => (value: string) => {
    const numValue = parseInt(value, 10);

    const hpa: HorizontalPodAutoscalerKind = field.value;
    const { metric, index } = getMetricByType(hpa, type);
    const hpaMetrics = hpa.spec.metrics || [];

    const updatedMetrics = [...hpaMetrics];
    updatedMetrics[index] = {
      ...metric,
      resource: {
        ...metric.resource,
        target: {
          ...metric.resource.target,
          averageUtilization: numValue,
        },
      },
    };

    setFieldValue(name, {
      ...hpa,
      spec: {
        ...hpa.spec,
        metrics: updatedMetrics,
      },
    });
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <Flex direction={{ default: 'column' }}>
          {values.showCanUseYAMLMessage && (
            <Alert
              actionClose={
                <AlertActionCloseButton
                  onClose={() => setFieldValue('showCanUseYAMLMessage', false)}
                />
              }
              isInline
              title={
                'Note: Some fields may not be represented in this form view. Please select "YAML view" for full control.'
              }
              variant="info"
            />
          )}
          <InputField label="Name" name={`${name}.metadata.name`} />
          <NumberSpinnerField label="Minimum Pods" name={`${name}.spec.minReplicas`} />
          <NumberSpinnerField label="Maximum Pods" name={`${name}.spec.maxReplicas`} />
          <HPAUtilizationField
            disabled={values.disabledFields.cpuUtilization}
            hpa={field.value}
            label="CPU"
            onUpdate={updateField('cpu')}
            type="cpu"
          />
          <HPAUtilizationField
            disabled={values.disabledFields.memoryUtilization}
            hpa={field.value}
            label="Memory"
            onUpdate={updateField('memory')}
            type="memory"
          />
        </Flex>
      </div>
    </div>
  );
};

export default HPADetailsForm;
