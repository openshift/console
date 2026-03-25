import type { FormEvent, FC } from 'react';
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
import type { FormikErrors } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import type { HorizontalPodAutoscalerKind, HPAMetric } from '@console/internal/module/k8s';
import { getMetricByType } from './hpa-utils';
import type { HPAFormValues, SupportedMetricTypes } from './types';

type HPAUtilizationFieldProps = {
  disabled?: boolean;
  hpa: HorizontalPodAutoscalerKind;
  label: string;
  onUpdate: (event: FormEvent<HTMLInputElement>, stringValue: string) => void;
  type: SupportedMetricTypes;
};

const HPAUtilizationField: FC<HPAUtilizationFieldProps> = ({
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
            aria-describedby={`${type}-utilization-unit`}
          />
        </InputGroupItem>
        <InputGroupText id={`${type}-utilization-unit`}>
          <PercentIcon />
        </InputGroupText>
      </InputGroup>

      <FormHelperText>
        <HelperText>
          {error ? (
            <HelperTextItem variant="error">{error}</HelperTextItem>
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
