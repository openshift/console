import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { ValidationErrorType, asValidationObject } from '@console/shared/src/utils/validation';
import {
  concatImmutableLists,
  iGet,
  iGetIsLoaded,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import {
  getFlavors,
  getOperatingSystems,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { flavorSort, ignoreCaseSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { getPlaceholder } from '../../utils/renderable-field-utils';
import { nullOnEmptyChange } from '../../utils/utils';
import { operatingSystemsNative } from '../../native/consts';

export const OSFlavor: React.FC<OSFlavorProps> = React.memo(
  ({
    userTemplates,
    commonTemplates,
    userTemplate,
    operatinSystemField,
    flavorField,
    workloadProfile,
    onChange,
    openshiftFlag,
  }) => {
    const flavor = iGetFieldValue(flavorField);
    const os = iGetFieldValue(operatinSystemField);
    const display = iGet(operatinSystemField, 'display');
    const displayOnly = !!display;

    const params = {
      userTemplate,
      flavor,
      workload: workloadProfile,
      os,
    };

    const vanillaTemplates = immutableListToShallowJS(
      concatImmutableLists(iGetLoadedData(commonTemplates), iGetLoadedData(userTemplates)),
    );

    let operatingSystems;

    if (displayOnly) {
      operatingSystems = [{ name: display, id: display }];
    } else {
      operatingSystems = openshiftFlag
        ? ignoreCaseSort(getOperatingSystems(vanillaTemplates, params), ['name'])
        : operatingSystemsNative;
    }

    const flavors = flavorSort(getFlavors(vanillaTemplates, params));

    const workloadProfiles = getWorkloadProfiles(vanillaTemplates, params);

    const loadingResources = openshiftFlag
      ? {
          userTemplates,
          commonTemplates,
        }
      : {};

    let operatingSystemValidation;
    let flavorValidation;

    if (
      iGetIsLoaded(commonTemplates) &&
      iGetIsLoaded(userTemplates) &&
      (operatingSystems.length === 0 || flavors.length === 0 || workloadProfiles.length === 0)
    ) {
      const validation = asValidationObject(
        'There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.',
        ValidationErrorType.Info,
      );
      if (!operatinSystemField.get('validation')) {
        operatingSystemValidation = validation;
      } else if (!flavorField.get('validation')) {
        flavorValidation = validation;
      }
    }

    return (
      <>
        <FormFieldRow
          field={operatinSystemField}
          fieldType={FormFieldType.SELECT}
          validation={operatingSystemValidation}
          loadingResources={loadingResources}
        >
          <FormField value={displayOnly ? display : undefined}>
            <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.OPERATING_SYSTEM)}>
              {!displayOnly && (
                <FormSelectPlaceholderOption
                  placeholder={getPlaceholder(VMSettingsField.OPERATING_SYSTEM)}
                  isDisabled={!!os}
                />
              )}
              {operatingSystems.map(({ id, name }) => {
                return <FormSelectOption key={id} value={id} label={name || id} />;
              })}
            </FormSelect>
          </FormField>
        </FormFieldRow>
        <FormFieldRow
          field={flavorField}
          fieldType={FormFieldType.SELECT}
          validation={flavorValidation}
          loadingResources={loadingResources}
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
  openshiftFlag: boolean;
  onChange: (key: string, value: string) => void;
};
