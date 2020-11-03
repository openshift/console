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
import {
  getOsDefaultTemplate,
  getWorkloadLabel,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { ignoreCaseSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { nullOnEmptyChange } from '../../utils/utils';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { FormPFSelect } from '../../../form/form-pf-select';
import { WorkloadProfile } from '../../../../constants/vm/workload-profile';
import { getLabelValue } from '../../../../selectors/selectors';

export const WorkloadSelect: React.FC<WorkloadProps> = React.memo(
  ({
    iUserTemplate,
    cnvBaseImages,
    commonTemplates,
    os,
    workloadProfileField,
    operatingSystem,
    flavor,
    onChange,
  }) => {
    const isUserTemplateValid = iGetIsLoaded(iUserTemplate) && !iGetLoadError(iUserTemplate);

    const templates = iUserTemplate
      ? isUserTemplateValid
        ? [toShallowJS(iGetLoadedData(iUserTemplate))]
        : []
      : immutableListToShallowJS(iGetLoadedData(commonTemplates));

    const defaultTemplate = getOsDefaultTemplate(templates, os);

    const workloadProfiles = ignoreCaseSort(
      getWorkloadProfiles(templates, {
        flavor,
        os: operatingSystem,
      }),
    );

    const loadingResources: any = {
      commonTemplates,
    };

    if (iUserTemplate) {
      loadingResources.iUserTemplate = iUserTemplate;
    }

    if (cnvBaseImages && !iGetIsLoaded(cnvBaseImages) && !iGetLoadError(cnvBaseImages)) {
      loadingResources.cnvBaseImages = cnvBaseImages;
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
              {(workloadProfiles || [])
                .map(WorkloadProfile.fromString)
                .sort((a, b) => a.getOrder() - b.getOrder())
                .map((workload) => {
                  const isDefault =
                    getLabelValue(defaultTemplate, getWorkloadLabel(workload.getValue())) ===
                    'true';

                  return (
                    <SelectOption
                      key={workload.getValue()}
                      value={workload.getValue()}
                      description={workload.getDescription()}
                    >
                      {workload.toString().concat(isDefault ? ' (default)' : '')}
                    </SelectOption>
                  );
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
  os: string;
  workloadProfileField: any;
  flavor: string;
  operatingSystem: string;
  cnvBaseImages: any;
  onChange: (key: string, value: string) => void;
};
