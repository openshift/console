import * as React from 'react';
import { FormikErrors, useFormikContext } from 'formik';
import { FormGroup, InputGroup, InputGroupText, TextInput } from '@patternfly/react-core';
import { PercentIcon } from '@patternfly/react-icons';
import { HorizontalPodAutoscalerKind, HPAMetric } from '@console/internal/module/k8s';
import { getMetricByType } from './hpa-utils';
import { HPAFormValues, SupportedMetricTypes } from './types';

type HPAUtilizationFieldProps = {
  disabled?: boolean;
  hpa: HorizontalPodAutoscalerKind;
  label: string;
  onUpdate: (stringValue: string) => void;
  type: SupportedMetricTypes;
};

const HPAUtilizationField: React.FC<HPAUtilizationFieldProps> = ({
  disabled,
  hpa,
  label,
  onUpdate,
  type,
}) => {
  const { errors } = useFormikContext<HPAFormValues>();
  const { metric, index } = getMetricByType(hpa, type);
  const value: number = metric?.resource?.target?.averageUtilization;
  const thisErrorMetric = errors.formData?.spec?.metrics?.[index] as FormikErrors<HPAMetric>;
  const error: string = thisErrorMetric?.resource?.target?.averageUtilization;

  return (
    <FormGroup
      fieldId={`${type}-utilization`}
      label={`${label} Utilization`}
      helperText={`${label} request and limit must be set before ${label} utilization can be set.`}
      helperTextInvalid={error}
      validated={error ? 'error' : null}
    >
      <InputGroup>
        <TextInput
          id={type}
          type="text"
          isDisabled={disabled}
          onChange={onUpdate}
          value={Number.isNaN(value) ? '' : value}
        />
        <InputGroupText id="percent" aria-label="%">
          <PercentIcon />
        </InputGroupText>
      </InputGroup>
    </FormGroup>
  );
};

export default HPAUtilizationField;
