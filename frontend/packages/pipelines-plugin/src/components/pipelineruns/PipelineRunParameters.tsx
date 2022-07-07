import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { MultiColumnField, InputField } from '@console/shared';

const PipelineRunParameters: React.FC<FormikProps<FormikValues>> = () => {
  const { t } = useTranslation();
  const emptyMessage = t('pipelines-plugin~No parameters are associated with this PipelineRun.');

  const nameLabel = t('pipelines-plugin~Name');
  const descriptionLabel = t('pipelines-plugin~Description');
  const defaultValueLabel = t('pipelines-plugin~Value');

  return (
    <div className="co-m-pane__body">
      <div className="co-m-pane__form">
        <MultiColumnField
          data-test="pipelineRun-parameters"
          name="parameters"
          headers={[
            {
              name: nameLabel,
              required: false,
            },
            descriptionLabel,
            defaultValueLabel,
          ]}
          emptyValues={{ name: '', description: '', value: '' }}
          emptyMessage={emptyMessage}
          isReadOnly
        >
          <InputField
            data-test="name"
            name="name"
            type={TextInputTypes.text}
            placeholder={nameLabel}
            aria-label={nameLabel}
            isDisabled
          />
          <InputField
            data-test="description"
            name="description"
            type={TextInputTypes.text}
            placeholder={descriptionLabel}
            aria-label={descriptionLabel}
            isDisabled
          />
          <InputField
            data-test="value"
            name="value"
            type={TextInputTypes.text}
            placeholder={defaultValueLabel}
            aria-label={defaultValueLabel}
            isDisabled
          />
        </MultiColumnField>
      </div>
    </div>
  );
};

export default PipelineRunParameters;
