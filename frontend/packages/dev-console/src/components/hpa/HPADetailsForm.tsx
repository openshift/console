import * as React from 'react';
import { Alert, AlertActionCloseButton, Flex } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import { InputField, NumberSpinnerField } from '@console/shared';
import { getMetricByType } from './hpa-utils';
import HPAUtilizationField from './HPAUtilizationField';
import { HPAFormValues, SupportedMetricTypes } from './types';

const HPADetailsForm: React.FC = () => {
  const { t } = useTranslation();
  const name = 'formData';
  const [field] = useField<HorizontalPodAutoscalerKind>(name);
  const {
    setFieldValue,
    values: {
      disabledFields: { name: nameDisabled, cpuUtilization, memoryUtilization },
      showCanUseYAMLMessage,
    },
  } = useFormikContext<HPAFormValues>();

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
    <>
      {showCanUseYAMLMessage && (
        <Alert
          actionClose={
            <AlertActionCloseButton onClose={() => setFieldValue('showCanUseYAMLMessage', false)} />
          }
          isInline
          title={t(
            'devconsole~Note: Some fields may not be represented in this form view. Please select "YAML view" for full control.',
          )}
          variant="info"
        />
      )}
      <div className="row">
        <div className="col-lg-8">
          <Flex direction={{ default: 'column' }}>
            <InputField
              isDisabled={nameDisabled}
              label={t('devconsole~Name')}
              name={`${name}.metadata.name`}
            />
            <NumberSpinnerField
              label={t('devconsole~Minimum Pods')}
              name={`${name}.spec.minReplicas`}
            />
            <NumberSpinnerField
              label={t('devconsole~Maximum Pods')}
              name={`${name}.spec.maxReplicas`}
            />
            <HPAUtilizationField
              disabled={cpuUtilization}
              hpa={field.value}
              label={t('devconsole~CPU')}
              onUpdate={updateField('cpu')}
              type="cpu"
            />
            <HPAUtilizationField
              disabled={memoryUtilization}
              hpa={field.value}
              label={t('devconsole~Memory')}
              onUpdate={updateField('memory')}
              type="memory"
            />
          </Flex>
        </div>
      </div>
    </>
  );
};

export default HPADetailsForm;
