import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getName, ValidationErrorType, ValidationObject } from '@console/shared';
import { getLoadedData, getLoadError, isLoaded } from '../../utils';
import { ignoreCaseSort } from '../../utils/sort';
import { FormRow } from './form-row';
import { asFormSelectValue, FormSelectPlaceholderOption } from './form-select-placeholder-option';

type K8sResourceSelectProps = {
  id: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isPlaceholderDisabled?: boolean;
  hasPlaceholder?: boolean;
  data?: FirehoseResult<K8sResourceKind[]>;
  name?: string;
  onChange: (name: string) => void;
  model: K8sKind;
  title?: string;
  validation?: ValidationObject;
  filter?: (obj: K8sResourceKind) => boolean;
  getResourceLabel?: (resource: K8sResourceKind) => string;
};

export const K8sResourceSelectRow: React.FC<K8sResourceSelectProps> = ({
  id,
  isDisabled,
  isRequired,
  isPlaceholderDisabled,
  hasPlaceholder,
  data,
  onChange,
  name,
  model,
  title,
  validation,
  filter,
  getResourceLabel,
}) => {
  const isLoading = !isLoaded(data);
  const loadError = getLoadError(data, model);

  let loadedData = getLoadedData(data, []);

  if (filter) {
    loadedData = loadedData.filter(filter);
  }

  let nameValue;
  let missingError;

  if (name && !isLoading && !loadError && !loadedData.some((entity) => getName(entity) === name)) {
    missingError = `Selected ${name} is not available`;
  } else {
    nameValue = name;
  }

  return (
    <FormRow
      title={title || model.label}
      fieldId={id}
      isLoading={isLoading}
      validationMessage={loadError || missingError || (validation && validation.message)}
      validationType={
        loadError || missingError ? ValidationErrorType.Error : validation && validation.type
      }
      isRequired={isRequired}
    >
      <FormSelect
        onChange={onChange}
        value={asFormSelectValue(nameValue)}
        id={id}
        isDisabled={isDisabled || isLoading || loadError}
      >
        {hasPlaceholder && (
          <FormSelectPlaceholderOption
            isDisabled={isPlaceholderDisabled}
            placeholder={
              loadedData.length === 0
                ? `--- ${model.labelPlural} not available ---`
                : `--- Select ${model.label} ---`
            }
          />
        )}
        {ignoreCaseSort(loadedData, ['metadata', 'name']).map((entity) => {
          const selectName = getName(entity);
          const label = getResourceLabel && getResourceLabel(entity);

          return (
            <FormSelectOption key={selectName} value={selectName} label={label || selectName} />
          );
        })}
      </FormSelect>
    </FormRow>
  );
};
