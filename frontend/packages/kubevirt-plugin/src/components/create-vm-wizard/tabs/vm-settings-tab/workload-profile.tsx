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
import { getWorkloadProfiles } from '../../../../selectors/vm-template/combined-dependent';
import { ignoreCaseSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { getPlaceholder } from '../../utils/renderable-field-utils';
import { nullOnEmptyChange } from '../../utils/utils';
import { iGetFieldValue } from '../../selectors/immutable/field';

export const WorkloadProfile: React.FC<WorkloadProps> = React.memo(
  ({
    userTemplates,
    commonTemplates,
    workloadProfileField,
    userTemplate,
    operatingSystem,
    flavor,
    commonDataVolumes,
    onChange,
  }) => {
    const vanillaTemplates = immutableListToShallowJS(
      concatImmutableLists(iGetLoadedData(commonTemplates), iGetLoadedData(userTemplates)),
    );
    const workloadProfiles = ignoreCaseSort(
      getWorkloadProfiles(vanillaTemplates, {
        userTemplate,
        flavor,
        os: operatingSystem,
      }),
    );

    return (
      <>
        <FormFieldRow
          field={workloadProfileField}
          fieldType={FormFieldType.SELECT}
          loadingResources={{
            userTemplates,
            commonTemplates,
            commonDataVolumes,
          }}
        >
          <FormField>
            <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.WORKLOAD_PROFILE)}>
              <FormSelectPlaceholderOption
                placeholder={getPlaceholder(VMSettingsField.WORKLOAD_PROFILE)}
                isDisabled={!!iGetFieldValue(workloadProfileField)}
              />
              {workloadProfiles.map((workloadProfile) => {
                return (
                  <FormSelectOption
                    key={workloadProfile}
                    value={workloadProfile}
                    label={workloadProfile}
                  />
                );
              })}
            </FormSelect>
          </FormField>
        </FormFieldRow>
      </>
    );
  },
);

type WorkloadProps = {
  userTemplates: any;
  commonTemplates: any;
  workloadProfileField: any;
  userTemplate: string;
  flavor: string;
  operatingSystem: string;
  commonDataVolumes: any;
  onChange: (key: string, value: string) => void;
};
