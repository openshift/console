import * as React from 'react';
import { FieldArray } from 'formik';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, useFormikValidationFix } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { taskParamIsRequired } from '../../pipeline-builder/utils';
import { ModalParameter } from './types';

type ParametersSectionProps = {
  parameters: ModalParameter[];
};

const PipelineParameterSection: React.FC<ParametersSectionProps> = ({ parameters }) => {
  const { t } = useTranslation();
  useFormikValidationFix(parameters);
  return (
    <FieldArray
      name="parameters"
      key="parameters-row"
      render={() =>
        parameters.length > 0 && (
          <FormSection title={t('pipelines-plugin~Parameters')} fullWidth>
            {parameters.map((parameter, index) => (
              <InputField
                key={parameter.name}
                name={`parameters.${index}.value`}
                type={TextInputTypes.text}
                label={parameter.name}
                helpText={parameter.description}
                required={taskParamIsRequired(parameter)}
              />
            ))}
          </FormSection>
        )
      }
    />
  );
};

export default PipelineParameterSection;
