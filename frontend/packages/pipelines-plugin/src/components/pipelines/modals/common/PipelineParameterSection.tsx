import * as React from 'react';
import { FieldArray } from 'formik';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import { PipelineParam } from '../../../../utils/pipeline-augment';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

type ParametersSectionProps = {
  parameters: PipelineParam[];
};

const PipelineParameterSection: React.FC<ParametersSectionProps> = ({ parameters }) => {
  const { t } = useTranslation();
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
                name={`parameters.${index}.default`}
                type={TextInputTypes.text}
                label={parameter.name}
                helpText={parameter.description}
                placeholder={t('pipelines-plugin~Name')}
                required
              />
            ))}
          </FormSection>
        )
      }
    />
  );
};

export default PipelineParameterSection;
