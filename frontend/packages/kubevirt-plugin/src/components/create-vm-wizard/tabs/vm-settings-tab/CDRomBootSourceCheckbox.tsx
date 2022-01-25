import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldRow } from '../../form/form-field-row';
import { VMSettingsField } from '../../types';
import { getFieldId } from '../../utils/renderable-field-utils';

export const CDRomBootSourceCheckbox: React.FC<CDRomBootSourceCheckboxProps> = ({
  field,
  onChange,
}) => {
  const { t } = useTranslation();
  const handleCDRomBootSource = (isCDRomBootSource: boolean) => {
    onChange(VMSettingsField.IS_CDROM_BOOT_SOURCE, isCDRomBootSource);
  };
  return (
    <FormFieldRow field={field} fieldType={FormFieldType.INLINE_CHECKBOX}>
      <FormField>
        <Checkbox
          className="kv-create-vm__input-checkbox"
          id={getFieldId(VMSettingsField.IS_CDROM_BOOT_SOURCE)}
          onChange={(v) => handleCDRomBootSource(v)}
        />
      </FormField>
      <div className="pf-c-form__helper-text" aria-live="polite">
        {t('kubevirt-plugin~To boot this source from a CD-ROM. This will create "install" disk.')}
      </div>
    </FormFieldRow>
  );
};

type CDRomBootSourceCheckboxProps = {
  field: any;
  onChange: (key: string, value: string | boolean) => void;
};
