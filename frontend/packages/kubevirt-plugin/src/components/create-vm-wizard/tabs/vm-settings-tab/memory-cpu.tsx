import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { Integer } from '../../../form/integer/integer';
import { VMSettingsField } from '../../types';
import { isFieldHidden } from '../../selectors/immutable/vm-settings';

import './vm-settings-tab.scss';

export const MemoryCPU: React.FC<MemoryCPUProps> = React.memo(
  ({ memoryField, cpuField, onChange, isReview }) => {
    if (isFieldHidden(memoryField) && isFieldHidden(cpuField)) {
      return null;
    }
    const memory = (
      <FormFieldMemoRow field={memoryField} fieldType={FormFieldType.TEXT}>
        <FormField>
          <Integer
            isFullWidth
            isPositive
            onChange={(value) => onChange(VMSettingsField.MEMORY, value)}
          />
        </FormField>
      </FormFieldMemoRow>
    );

    const cpu = (
      <FormFieldMemoRow field={cpuField} fieldType={FormFieldType.TEXT}>
        <FormField>
          <Integer
            isFullWidth
            isPositive
            onChange={(value) => onChange(VMSettingsField.CPU, value)}
          />
        </FormField>
      </FormFieldMemoRow>
    );

    if (isReview) {
      return (
        <>
          {memory}
          {cpu}
        </>
      );
    }

    return (
      <Grid>
        <GridItem span={6} className="kubevirt-create-vm-modal__memory-row">
          {memory}
        </GridItem>
        <GridItem span={6}>{cpu}</GridItem>
      </Grid>
    );
  },
);

type MemoryCPUProps = {
  isReview: boolean;
  memoryField: any;
  cpuField: any;
  onChange: (key: string, value: string) => void;
};
