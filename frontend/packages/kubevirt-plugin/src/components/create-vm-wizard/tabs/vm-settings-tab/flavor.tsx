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
  getFlavorLabel,
  getFlavors,
  getOsDefaultTemplate,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { flavorSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { nullOnEmptyChange } from '../../utils/utils';
import { FormPFSelect } from '../../../form/form-pf-select';
import { Flavor } from '../../../../constants/vm/flavor';
import { getCPU, getFlavor, getMemory } from '../../../../selectors/vm';
import { getFlavorText } from '../../../../selectors/vm/flavor-text';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { getLabelValue } from '../../../../selectors/selectors';

export const FlavorSelect: React.FC<FlavorProps> = React.memo(
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

    const defaultTemplate = getOsDefaultTemplate(templates, os);

    const flavors = flavorSort(getFlavors(templates, params));
    const flavorDescriptions = templates.reduce((acc, t) => {
      acc[getFlavor(t)] = getFlavorText({
        cpu: getCPU(selectVM(t)),
        memory: getMemory(selectVM(t)),
      });
      return acc;
    }, {});

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
            {flavors
              .map(Flavor.fromString)
              .sort((a, b) => a.getOrder() - b.getOrder())
              .map((f) => {
                const flavorDesc = flavorDescriptions?.[f.getValue()];
                const isDefault =
                  getLabelValue(defaultTemplate, getFlavorLabel(f.getValue())) === 'true';

                return (
                  <SelectOption
                    key={f.getValue()}
                    value={f.getValue()}
                    description={f.getDescription()}
                  >
                    {f.toString().concat(isDefault ? ' (default)' : '')}
                    {flavorDesc && f !== Flavor.CUSTOM && ` - ${flavorDesc}`}
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
