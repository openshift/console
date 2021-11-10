import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Integer } from '../../../form/integer/integer';
import { SizeUnitFormRow } from '../../../form/size-unit-form-row';
import {
  BinaryUnit,
  getReasonableUnits,
  stringValueUnitSplit,
} from '../../../form/size-unit-utils';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { iGetFieldValue, isFieldHidden } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';

import './vm-settings-tab.scss';

export const MemoryCPU: React.FC<MemoryCPUProps> = React.memo(
  ({ memoryField, cpuField, onChange }) => {
    const mem = iGetFieldValue(memoryField);
    const [size, unit] = stringValueUnitSplit(_.isString(mem) ? mem : '');
    const hasSize = size != null && !_.isNaN(size);

    const onSizeChange = React.useCallback(
      (value) =>
        onChange(VMSettingsField.MEMORY, value == null ? unit : `${value}${unit || BinaryUnit.Gi}`),
      [onChange, unit],
    );

    const onUnitChange = React.useCallback(
      (value) => onChange(VMSettingsField.MEMORY, hasSize ? `${size}${value}` : value),
      [hasSize, onChange, size],
    );

    const onIntegerChange = React.useCallback((value) => onChange(VMSettingsField.CPU, value), [
      onChange,
    ]);

    if (isFieldHidden(memoryField) && isFieldHidden(cpuField)) {
      return null;
    }

    return (
      <Grid>
        <GridItem span={6} className="kubevirt-create-vm-modal__memory-row">
          <FormFieldMemoRow field={memoryField} fieldType={FormFieldType.TEXT}>
            <FormField>
              <SizeUnitFormRow
                title={''}
                size={hasSize ? size : ''}
                unit={(unit as BinaryUnit) || BinaryUnit.Gi}
                units={getReasonableUnits(unit)}
                onSizeChanged={onSizeChange}
                onUnitChanged={onUnitChange}
              />
            </FormField>
          </FormFieldMemoRow>
        </GridItem>
        <GridItem span={6}>
          <FormFieldMemoRow field={cpuField} fieldType={FormFieldType.TEXT}>
            <FormField>
              <Integer isFullWidth isPositive onChange={onIntegerChange} />
            </FormField>
          </FormFieldMemoRow>
        </GridItem>
      </Grid>
    );
  },
);
MemoryCPU.displayName = 'MemoryCPU';

type MemoryCPUProps = {
  memoryField: any;
  cpuField: any;
  onChange: (key: string, value: string) => void;
};
