import * as React from 'react';
import {FormFieldReviewMemoRow} from '../../form/form-field-review-row';
import {VMSettingsField} from '../../types';
import {FormFieldType} from '../../form/form-field';
import {getField, getReviewValue} from './utils';

export const FlavorReviewRow: React.FC<FlavorReviewRowProps> = (props) => {
  const { vmSettings } = props;

  const flavor = getField(VMSettingsField.FLAVOR, vmSettings);
  const flavorValue = getReviewValue(flavor, FormFieldType.SELECT);

  const memoryValue = getReviewValue(getField(VMSettingsField.MEMORY, vmSettings), FormFieldType.TEXT);
  const cpuValue = getReviewValue(getField(VMSettingsField.CPU, vmSettings), FormFieldType.TEXT);

  // TODO Handle non-existent CPU/memory case
  // TODO Insert space in memory output?

  const reviewStr = `${flavorValue}: ${cpuValue} CPU, ${memoryValue}`;

  return (
    <FormFieldReviewMemoRow
      key={VMSettingsField.FLAVOR}
      field={flavor}
      fieldType={FormFieldType.SELECT}
      value={reviewStr}
    />
  );
};

type FlavorReviewRowProps = {
  vmSettings: any;
};
