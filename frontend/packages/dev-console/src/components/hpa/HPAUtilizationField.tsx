import * as React from 'react';
import {
  FormGroup,
  InputGroup,
  InputGroupText,
  TextInput,
  InputGroupItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { PercentIcon } from '@patternfly/react-icons/dist/esm/icons/percent-icon';
import { FormikErrors, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { RedExclamationCircleIcon } from '@console/dynamic-plugin-sdk';
import { HorizontalPodAutoscalerKind, HPAMetric } from '@console/internal/module/k8s';
import { getMetricByType } from './hpa-utils';
import { HPAFormValues, SupportedMetricTypes } from './types';

type HPAUtilizationFieldProps = {
  disabled?: boolean;
  hpa: HorizontalPodAutoscalerKind;
  label: string;
  onUpdate: (event: React.FormEvent<HTMLInputElement>, stringValue: string) => void;
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
  const { t } = useTranslation();
  return (
    <FormGroup
      fieldId={`${type}-utilization`}
      label={t('devconsole~{{label}} Utilization', { label })}
    >
      <InputGroup>
        <InputGroupItem isFill>
          <TextInput
            id={type}
            type="text"
            isDisabled={disabled}
            onChange={onUpdate}
            value={Number.isNaN(value) ? '' : value}
          />
        </InputGroupItem>
        <InputGroupItem isBox>
          <InputGroupText id="percent" aria-label="%">
            <PercentIcon />
          </InputGroupText>
        </InputGroupItem>
      </InputGroup>

      <FormHelperText>
        <HelperText>
          {error ? (
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {error}
            </HelperTextItem>
          ) : (
            <HelperTextItem>
              {t(
                'devconsole~{{label}} request and limit must be set before {{label}} utilization can be set.',
                { label },
              )}
            </HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default HPAUtilizationField;
