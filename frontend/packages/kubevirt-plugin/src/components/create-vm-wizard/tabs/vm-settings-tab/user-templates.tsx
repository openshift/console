import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { iGetIsLoaded, iGetLoadedData } from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ignoreCaseSort } from '../../../../utils/sort';
import { VMSettingsField } from '../../types';
import { NO_TEMPLATE, NO_TEMPLATE_AVAILABLE } from '../../strings/strings';
import { nullOnEmptyChange } from '../../utils/utils';
import { iGetName } from '../../selectors/immutable/selectors';

export const UserTemplates: React.FC<UserTemplatesProps> = React.memo(
  ({ userTemplateField, userTemplates, commonTemplates, dataVolumes, onChange }) => {
    const data = iGetLoadedData(userTemplates);
    const names =
      data &&
      data
        .toIndexedSeq()
        .toArray()
        .map(iGetName);
    const sortedNames = ignoreCaseSort(names);
    const hasUserTemplates = sortedNames.length > 0;

    return (
      <FormFieldRow
        field={userTemplateField}
        fieldType={FormFieldType.SELECT}
        loadingResources={{
          userTemplates,
          commonTemplates,
          dataVolumes,
        }}
      >
        <FormField isDisabled={!hasUserTemplates}>
          <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.USER_TEMPLATE)}>
            <FormSelectPlaceholderOption
              placeholder={hasUserTemplates ? NO_TEMPLATE : NO_TEMPLATE_AVAILABLE}
            />
            {sortedNames.map((name) => {
              return <FormSelectOption key={name} value={name} label={name} />;
            })}
          </FormSelect>
        </FormField>
      </FormFieldRow>
    );
  },
  (prevProps, nextProps) =>
    iGetIsLoaded(prevProps.dataVolumes) === iGetIsLoaded(nextProps.dataVolumes) && // wait for dataVolumes; required when pre-filling template
    iGetIsLoaded(prevProps.commonTemplates) === iGetIsLoaded(nextProps.commonTemplates) && // wait -||-
    prevProps.userTemplateField === nextProps.userTemplateField &&
    prevProps.userTemplates === nextProps.userTemplates,
);

type UserTemplatesProps = {
  userTemplateField: any;
  userTemplates: any;
  commonTemplates: any;
  dataVolumes: any;
  onChange: (key: string, value: string) => void;
};
