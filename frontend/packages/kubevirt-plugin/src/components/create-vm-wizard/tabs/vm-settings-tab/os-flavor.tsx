import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import {
  concatImmutableLists,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import {
  getFlavors,
  getOperatingSystems,
} from '../../../../selectors/vm-template/combined-dependent';
import { flavorSort, ignoreCaseSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { iGetFieldValue } from '../../selectors/immutable/vm-settings';
import { getPlaceholder } from '../../utils/vm-settings-tab-utils';
import { nullOnEmptyChange } from '../../utils/utils';

export const OSFlavor: React.FC<OSFlavorProps> = React.memo(
  ({
    userTemplates,
    commonTemplates,
    userTemplate,
    operatinSystemField,
    flavorField,
    workloadProfile,
    onChange,
  }) => {
    const flavor = iGetFieldValue(flavorField);
    const os = iGetFieldValue(operatinSystemField);
    const params = {
      userTemplate,
      flavor,
      workload: workloadProfile,
      os,
    };

    const vanillaTemplates = immutableListToShallowJS(
      concatImmutableLists(iGetLoadedData(commonTemplates), iGetLoadedData(userTemplates)),
    );

    const operatingSystems = ignoreCaseSort(getOperatingSystems(vanillaTemplates, params), [
      'name',
    ]);

    const flavors = flavorSort(getFlavors(vanillaTemplates, params));

    return (
      <>
        <FormFieldRow
          field={operatinSystemField}
          fieldType={FormFieldType.SELECT}
          loadingResources={{
            userTemplates,
            commonTemplates,
          }}
        >
          <FormField>
            <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.OPERATING_SYSTEM)}>
              <FormSelectPlaceholderOption
                placeholder={getPlaceholder(VMSettingsField.OPERATING_SYSTEM)}
                isDisabled={!!os}
              />
              {operatingSystems.map(({ id, name }) => {
                return <FormSelectOption key={id} value={id} label={name} />;
              })}
            </FormSelect>
          </FormField>
        </FormFieldRow>
        <FormFieldRow
          field={flavorField}
          fieldType={FormFieldType.SELECT}
          loadingResources={{
            userTemplates,
            commonTemplates,
          }}
        >
          <FormField isDisabled={flavor && flavors.length === 1}>
            <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.FLAVOR)}>
              <FormSelectPlaceholderOption
                placeholder={getPlaceholder(VMSettingsField.FLAVOR)}
                isDisabled={!!flavor}
              />
              {flavors.map((f) => {
                return <FormSelectOption key={f} value={f} label={f} />;
              })}
            </FormSelect>
          </FormField>
        </FormFieldRow>
      </>
    );
  },
);

type OSFlavorProps = {
  userTemplates: any;
  commonTemplates: any;
  flavorField: any;
  operatinSystemField: any;
  userTemplate: string;
  workloadProfile: string;
  onChange: (key: string, value: string) => void;
};
