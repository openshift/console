import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { Integer } from '../../../form/integer/integer';
import { VMSettingsField } from '../../types';
import { isFieldHidden } from '../../selectors/immutable/vm-settings';

import './vm-settings-tab.scss';

export const MemoryCPU: React.FC<MemoryCPUProps> = React.memo(
  ({ memoryField, cpuField, onChange }) => {
    if (isFieldHidden(memoryField) && isFieldHidden(cpuField)) {
      return null;
    }

    return (
      <Grid>
        <GridItem span={6} className="kubevirt-create-vm-modal__memory-row">
          <FormFieldMemoRow field={memoryField} fieldType={FormFieldType.TEXT}>
            <FormField>
              <Integer
                className="kubevirt-create-vm-modal__memory-input"
                isPositive
                onChange={(value) => onChange(VMSettingsField.MEMORY, value)}
              />
            </FormField>
          </FormFieldMemoRow>
        </GridItem>
        <GridItem span={6}>
          <FormFieldMemoRow field={cpuField} fieldType={FormFieldType.TEXT}>
            <FormField>
              <Integer
                className="kubevirt-create-vm-modal__cpu-input"
                isPositive
                onChange={(value) => onChange(VMSettingsField.CPU, value)}
              />
            </FormField>
          </FormFieldMemoRow>
        </GridItem>
      </Grid>
    );
  },
);

type MemoryCPUProps = {
  memoryField: any;
  cpuField: any;
  onChange: (key: string, value: string) => void;
};
