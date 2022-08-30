import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FieldArray, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, TextColumnField } from '@console/shared';
import { paramIsRequired } from '../../../../utils/common';
import AutoCompletePopover from '../../../shared/common/auto-complete/AutoCompletePopover';
import { CommonPipelineModalFormikValues, ModalParameter } from './types';

type ParametersSectionProps = {
  autoCompleteValues?: string[];
};

const PipelineParameterSection: React.FC<ParametersSectionProps> = ({ autoCompleteValues }) => {
  const { t } = useTranslation();

  const {
    setFieldValue,
    values: { parameters },
  } = useFormikContext<CommonPipelineModalFormikValues>();

  return (
    <FieldArray
      name="parameters"
      key="parameters-row"
      render={() =>
        parameters.length > 0 && (
          <FormSection title={t('pipelines-plugin~Parameters')} fullWidth>
            {parameters.map((parameter: ModalParameter, index) => {
              const name = `parameters.${index}.value`;
              const isRequired = paramIsRequired(parameter);

              const input = (ref?) => (
                <InputField
                  ref={ref}
                  name={name}
                  type={TextInputTypes.text}
                  label={parameter.name}
                  helpText={parameter.description}
                  required={isRequired}
                  autoComplete="off"
                />
              );
              return parameter.type === 'array' ? (
                <TextColumnField
                  name={name}
                  label={parameter.name}
                  helpText={parameter.description}
                  required={isRequired}
                  addLabel={`Add ${parameter.name}`}
                  data-test={`${parameter.name}-text-column-field`}
                >
                  {({ name: arrayName, ...additionalProps }) =>
                    autoCompleteValues ? (
                      <AutoCompletePopover
                        autoCompleteValues={autoCompleteValues}
                        onAutoComplete={(value: string) => setFieldValue(name, value)}
                      >
                        {(callbackRef) => (
                          <InputField
                            ref={callbackRef}
                            name={arrayName}
                            {...additionalProps}
                            autoComplete="off"
                          />
                        )}
                      </AutoCompletePopover>
                    ) : (
                      <InputField name={arrayName} {...additionalProps} autoComplete="off" />
                    )
                  }
                </TextColumnField>
              ) : (
                <React.Fragment key={parameter.name}>
                  {autoCompleteValues ? (
                    <AutoCompletePopover
                      autoCompleteValues={autoCompleteValues}
                      onAutoComplete={(value: string) => setFieldValue(name, value)}
                    >
                      {(callbackRef) => input(callbackRef)}
                    </AutoCompletePopover>
                  ) : (
                    input()
                  )}
                </React.Fragment>
              );
            })}
          </FormSection>
        )
      }
    />
  );
};

export default PipelineParameterSection;
