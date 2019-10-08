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
  isDisabled: boolean;
  isPlaceholderDisabled?: boolean;
  hasPlaceholder?: boolean;
  data?: FirehoseResult<K8sResourceKind[]>;
  name?: string;
  onChange: (name: string) => void;
  model: K8sKind;
  title?: string;
  validation?: ValidationObject;
  filter?: (obj: K8sResourceKind) => boolean;
};

export const K8sResourceSelectRow: React.FC<K8sResourceSelectProps> = ({
  id,
  isDisabled,
  isPlaceholderDisabled,
  hasPlaceholder,
  data,
  onChange,
  name,
  model,
  title,
  validation,
  filter,
}) => {
  const isLoading = !isLoaded(data);
  const loadError = getLoadError(data, model);

  let loadedData = getLoadedData(data, []);

  if (filter) {
    loadedData = loadedData.filter(filter);
  }

  return (
    <FormRow
      title={title || model.label}
      fieldId={id}
      isLoading={isLoading}
      validationMessage={loadError || (validation && validation.message)}
      validationType={loadError ? ValidationErrorType.Error : validation && validation.type}
    >
      <FormSelect
        onChange={onChange}
        value={asFormSelectValue(name)}
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
          return <FormSelectOption key={selectName} value={selectName} label={selectName} />;
        })}
      </FormSelect>
    </FormRow>
  );
};
