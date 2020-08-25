import * as _ from 'lodash';
import * as React from 'react';
import { SelectOption } from '@patternfly/react-core';
import { ValidationErrorType, asValidationObject } from '@console/shared/src/utils/validation';
import {
  concatImmutableLists,
  iGetIsLoaded,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import {
  getFlavors,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { flavorSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { nullOnEmptyChange } from '../../utils/utils';
import { FormPFSelect } from '../../../form/form-pf-select';

export const Flavor: React.FC<FlavorProps> = React.memo(
  ({
    userTemplates,
    commonTemplates,
    userTemplate,
    os,
    flavorField,
    workloadProfile,
    cnvBaseImages,
    onChange,
    openshiftFlag,
  }) => {
    const flavor = iGetFieldValue(flavorField);

    const params = {
      userTemplate,
      flavor,
      workload: workloadProfile,
      os,
    };

    const vanillaTemplates = immutableListToShallowJS(
      concatImmutableLists(iGetLoadedData(commonTemplates), iGetLoadedData(userTemplates)),
    );

    const flavors = flavorSort(getFlavors(vanillaTemplates, params));

    const workloadProfiles = getWorkloadProfiles(vanillaTemplates, params);

    const loadingResources = openshiftFlag
      ? {
          userTemplates,
          commonTemplates,
          cnvBaseImages,
        }
      : {};

    let flavorValidation;

    if (
      iGetIsLoaded(commonTemplates) &&
      iGetIsLoaded(userTemplates) &&
      (flavors.length === 0 || workloadProfiles.length === 0)
    ) {
      const validation = asValidationObject(
        'There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.',
        ValidationErrorType.Info,
      );
      if (!flavorField.get('validation')) {
        flavorValidation = validation;
      }
    }

    return (
      <FormFieldRow
        field={flavorField}
        fieldType={FormFieldType.PF_SELECT}
        validation={flavorValidation}
        loadingResources={loadingResources}
      >
        <FormField value={flavor} isDisabled={flavor && flavors.length === 1}>
          <FormPFSelect
            onSelect={(e, v) => nullOnEmptyChange(onChange, VMSettingsField.FLAVOR)(v.toString())}
          >
            {flavors.map((f) => {
              return (
                <SelectOption key={f} value={f}>
                  {_.capitalize(f)}
                </SelectOption>
              );
            })}
          </FormPFSelect>
        </FormField>
      </FormFieldRow>
    );
  },
);

type FlavorProps = {
  userTemplates: any;
  commonTemplates: any;
  flavorField: any;
  os: string;
  userTemplate: string;
  workloadProfile: string;
  cnvBaseImages: any;
  openshiftFlag: boolean;
  onChange: (key: string, value: string | boolean) => void;
};
