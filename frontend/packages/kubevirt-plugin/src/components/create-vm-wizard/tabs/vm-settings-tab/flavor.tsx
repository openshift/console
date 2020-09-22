import * as _ from 'lodash';
import * as React from 'react';
import { SelectOption } from '@patternfly/react-core';
import { ValidationErrorType, asValidationObject } from '@console/shared/src/utils/validation';
import {
  iGetIsLoaded,
  iGetLoadedData,
  iGetLoadError,
  immutableListToShallowJS,
  toShallowJS,
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
    iUserTemplate,
    cnvBaseImages,
    commonTemplates,
    os,
    flavorField,
    workloadProfile,
    onChange,
    openshiftFlag,
  }) => {
    const flavor = iGetFieldValue(flavorField);
    const isUserTemplateValid = iGetIsLoaded(iUserTemplate) && !iGetLoadError(iUserTemplate);

    const params = {
      flavor,
      workload: workloadProfile,
      os,
    };

    const templates = iUserTemplate
      ? isUserTemplateValid
        ? [toShallowJS(iGetLoadedData(iUserTemplate))]
        : []
      : immutableListToShallowJS(iGetLoadedData(commonTemplates));

    const flavors = flavorSort(getFlavors(templates, params));

    const workloadProfiles = getWorkloadProfiles(templates, params);

    const loadingResources: any = openshiftFlag
      ? {
          commonTemplates,
        }
      : {};

    if (iUserTemplate) {
      loadingResources.iUserTemplate = iUserTemplate;
    }

    if (cnvBaseImages && !iGetIsLoaded(cnvBaseImages) && !iGetLoadError(cnvBaseImages)) {
      loadingResources.cnvBaseImages = cnvBaseImages;
    }

    let flavorValidation;

    if (
      iGetIsLoaded(commonTemplates) &&
      (!iUserTemplate || isUserTemplateValid) &&
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
  iUserTemplate: any;
  commonTemplates: any;
  flavorField: any;
  os: string;
  workloadProfile: string;
  openshiftFlag: boolean;
  cnvBaseImages: any;
  onChange: (key: string, value: string | boolean) => void;
};
