import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import {
  iGetLoadedData,
  immutableListToShallowJS,
  iGetIsLoaded,
  iGetLoadError,
  toShallowJS,
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
    iUserTemplate,
    commonTemplates,
    workloadProfileField,
    operatingSystem,
    flavor,
    cnvBaseImages,
    onChange,
  }) => {
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
      cnvBaseImages,
    };

    if (iUserTemplate) {
      Object.assign(loadingResources, { iUserTemplate });
    }

    return (
      <>
        <FormFieldRow
          field={workloadProfileField}
          fieldType={FormFieldType.SELECT}
          loadingResources={loadingResources}
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
  iUserTemplate: any;
  commonTemplates: any;
  workloadProfileField: any;
  flavor: string;
  operatingSystem: string;
  cnvBaseImages: any;
  onChange: (key: string, value: string) => void;
};
