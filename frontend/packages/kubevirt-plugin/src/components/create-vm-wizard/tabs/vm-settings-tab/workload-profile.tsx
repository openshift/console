import * as React from 'react';
import { SelectOption } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { WorkloadProfile } from '../../../../constants/vm/workload-profile';
import { getLabelValue } from '../../../../selectors/selectors';
import {
  getOsDefaultTemplate,
  getWorkloadLabel,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import {
  iGetIsLoaded,
  iGetLoadedData,
  iGetLoadError,
  immutableListToShallowJS,
  toShallowJS,
} from '../../../../utils/immutable';
import { ignoreCaseSort } from '../../../../utils/sort';
import { FormPFSelect } from '../../../form/form-pf-select';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldRow } from '../../form/form-field-row';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';
import { nullOnEmptyChange } from '../../utils/utils';

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
    const { t } = useTranslation();
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
                      description={t(workload.getDescriptionKey())}
                    >
                      {isDefault
                        ? t('kubevirt-plugin~{{workload}} (default)', {
                            workload: t(workload.toString()),
                          })
                        : t(workload.toString())}
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
