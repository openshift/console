import type { FC } from 'react';
import { Fragment } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FieldArray, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import { InputField, TextColumnField } from '@console/shared';
import type { BuildFormikValues, BuildParam, ModalParameter } from './types';

export const paramIsRequired = (param: BuildParam): boolean => {
  return param.type === 'array' ? !param.defaults : !param.default;
};

type ParametersSectionProps = {
  autoCompleteValues?: string[];
};

type ParameterFieldsProps = {
  params: any[];
};

const ParameterFields: FC<ParameterFieldsProps> = ({ params }) => {
  return (
    <FieldArray
      name="parameters"
      key="parameters-row"
      render={() =>
        params.length > 0 && (
          <FormSection fullWidth>
            {params?.map((parameter: ModalParameter, index) => {
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
                <Fragment key={parameter.name}>{input()}</Fragment>
              );
            })}
          </FormSection>
        )
      }
    />
  );
};

const ParameterSection: FC<ParametersSectionProps> = () => {
  const { t } = useTranslation();
  const {
    values: { formData },
  } = useFormikContext<BuildFormikValues>();

  const requiredParams = formData?.parameters.filter((param) => paramIsRequired(param));
  const optionalParams = formData?.parameters.filter((param) => !paramIsRequired(param));

  return (
    formData?.parameters.length > 0 && (
      <FormSection title={t('shipwright-plugin~Parameters')}>
        {requiredParams.length > 0 ? (
          <ParameterFields params={requiredParams} />
        ) : (
          <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
            {t(
              'shipwright-plugin~No required parameters are associated with the selected build strategy.',
            )}
          </span>
        )}
        {optionalParams.length > 0 && (
          <ExpandCollapse
            textExpanded={t('shipwright-plugin~Hide optional parameters')}
            textCollapsed={t('shipwright-plugin~Show optional parameters')}
            dataTest="parameters-options"
          >
            <ParameterFields params={optionalParams} />
          </ExpandCollapse>
        )}
      </FormSection>
    )
  );
};

export default ParameterSection;
