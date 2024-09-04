import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FieldArray, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, TextColumnField } from '@console/shared';
import { BuildFormikValues, BuildParam, ModalParameter } from './types';

export const paramIsRequired = (param: BuildParam): boolean => {
  return param.type === 'array' ? !param.defaults : !param.default;
};

type ParametersSectionProps = {
  autoCompleteValues?: string[];
};

const ParameterSection: React.FC<ParametersSectionProps> = () => {
  const { t } = useTranslation();
  const {
    values: { formData },
  } = useFormikContext<BuildFormikValues>();

  return (
    <FormSection>
      <FieldArray
        name="parameters"
        key="parameters-row"
        render={() =>
          formData?.parameters.length > 0 && (
            <FormSection title={t('shipwright-plugin~Parameters')} fullWidth>
              {formData?.parameters.map((parameter: ModalParameter, index) => {
                const name = `formData.parameters.${index}.value`;
                const isRequired = paramIsRequired(parameter);
                const input = (ref?) => (
                  <InputField
                    ref={ref}
                    name={name}
                    type={TextInputTypes.text}
                    label={parameter.name}
                    helpText={parameter.description}
                    autoComplete="off"
                    required={isRequired}
                  />
                );
                return parameter.type === 'array' ? (
                  <TextColumnField
                    name={name}
                    label={parameter.name}
                    helpText={parameter.description}
                    addLabel={`Add ${parameter.name}`}
                    data-test={`${parameter.name}-text-column-field`}
                    key={parameter.name}
                    required={isRequired}
                  >
                    {({ name: arrayName, ...additionalProps }) => (
                      <InputField
                        name={arrayName}
                        {...additionalProps}
                        autoComplete="off"
                        required={isRequired}
                      />
                    )}
                  </TextColumnField>
                ) : (
                  <React.Fragment key={parameter.name}>{input()}</React.Fragment>
                );
              })}
            </FormSection>
          )
        }
      />
    </FormSection>
  );
};

export default ParameterSection;
