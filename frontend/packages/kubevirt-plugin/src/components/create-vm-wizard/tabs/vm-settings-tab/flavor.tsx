import * as React from 'react';
import { SelectOption } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { asValidationObject, ValidationErrorType } from '@console/shared/src/utils/validation';
import { CUSTOM_FLAVOR } from '../../../../constants';
import { Flavor } from '../../../../constants/vm/flavor';
import { getLabelValue } from '../../../../selectors/selectors';
import { getFlavor } from '../../../../selectors/vm';
import { getTemplateFlavorData } from '../../../../selectors/vm-template/advanced';
import {
  getFlavorLabel,
  getFlavors,
  getOsDefaultTemplate,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import {
  iGetIsLoaded,
  iGetLoadedData,
  iGetLoadError,
  immutableListToShallowJS,
  toShallowJS,
} from '../../../../utils/immutable';
import { flavorSort } from '../../../../utils/sort';
import { FormPFSelect } from '../../../form/form-pf-select';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldRow } from '../../form/form-field-row';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';
import { nullOnEmptyChange } from '../../utils/utils';

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
    const { t } = useTranslation();
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
    const flavorDescriptions = templates.reduce((acc, tmp) => {
      acc[getFlavor(tmp)] = getTemplateFlavorData(tmp);
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
      // t('kubevirt-plugin~There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.')
      const validation = asValidationObject(
        'kubevirt-plugin~There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.',
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
              .filter((f) => f && f !== CUSTOM_FLAVOR)
              .map(Flavor.fromString)
              .sort((a, b) => a.getOrder() - b.getOrder())
              .map((f) => {
                const flavorData = flavorDescriptions?.[f.getValue()];
                const isDefault =
                  getLabelValue(defaultTemplate, getFlavorLabel(f.getValue())) === 'true';

                return (
                  <SelectOption
                    key={f.getValue()}
                    value={f.getValue()}
                    description={t(f.getDescriptionKey())}
                  >
                    {isDefault
                      ? t(
                          'kubevirt-plugin~{{flavor}} (default): {{count}} CPU | {{memory}} Memory',
                          flavorData,
                        )
                      : t(
                          'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
                          flavorData,
                        )}
                  </SelectOption>
                );
              })
              .concat([
                <SelectOption
                  key={CUSTOM_FLAVOR}
                  value={CUSTOM_FLAVOR}
                  description={t(Flavor.fromString(CUSTOM_FLAVOR).getDescriptionKey())}
                >
                  {t('kubevirt-plugin~Custom')}
                </SelectOption>,
              ])}
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
