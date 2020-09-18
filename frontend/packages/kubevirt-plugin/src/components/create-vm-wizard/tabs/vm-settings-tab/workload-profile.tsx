import * as React from 'react';
import { SelectOption } from '@patternfly/react-core';
import {
  iGetLoadedData,
  immutableListToShallowJS,
  iGetIsLoaded,
  iGetLoadError,
  toShallowJS,
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
  ({ iUserTemplate, commonTemplates, workloadProfileField, operatingSystem, flavor, onChange }) => {
    const isUserTemplateValid = iGetIsLoaded(iUserTemplate) && !iGetLoadError(iUserTemplate);

    const templates = iUserTemplate
      ? isUserTemplateValid
        ? [toShallowJS(iGetLoadedData(iUserTemplate))]
        : []
      : immutableListToShallowJS(iGetLoadedData(commonTemplates));

    const workloadProfiles = ignoreCaseSort(
      getWorkloadProfiles(templates, {
        flavor,
        os: operatingSystem,
      }),
    );

    const loadingResources = {
      commonTemplates,
    };

    if (iUserTemplate) {
      Object.assign(loadingResources, { iUserTemplate });
    }

    return (
      <>
        <FormFieldRow
          field={workloadProfileField}
          fieldType={FormFieldType.PF_SELECT}
          loadingResources={loadingResources}
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
  iUserTemplate: any;
  commonTemplates: any;
  workloadProfileField: any;
  flavor: string;
  operatingSystem: string;
  onChange: (key: string, value: string) => void;
};
