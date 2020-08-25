import * as React from 'react';
import { SelectOption } from '@patternfly/react-core';
import {
  concatImmutableLists,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { getWorkloadProfiles } from '../../../../selectors/vm-template/combined-dependent';
import { ignoreCaseSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { nullOnEmptyChange } from '../../utils/utils';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { FormPFSelect } from '../../../form/form-pf-select';

export const WorkloadProfile: React.FC<WorkloadProps> = React.memo(
  ({
    userTemplates,
    commonTemplates,
    workloadProfileField,
    userTemplate,
    operatingSystem,
    flavor,
    cnvBaseImages,
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
          fieldType={FormFieldType.PF_SELECT}
          loadingResources={{
            userTemplates,
            commonTemplates,
            cnvBaseImages,
          }}
        >
          <FormField value={iGetFieldValue(workloadProfileField)}>
            <FormPFSelect
              onSelect={(e, v) =>
                nullOnEmptyChange(onChange, VMSettingsField.WORKLOAD_PROFILE)(v.toString())
              }
            >
              {workloadProfiles.map((workloadProfile) => {
                return <SelectOption key={workloadProfile} value={workloadProfile} />;
              })}
            </FormPFSelect>
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
  cnvBaseImages: any;
  onChange: (key: string, value: string) => void;
};
