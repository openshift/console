import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { MultiColumnField, InputField } from '@console/shared';

type PipelineParametersProps = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineParameters: React.FC<PipelineParametersProps> = (props) => {
  const { t } = useTranslation();
  const {
    addLabel = t('pipelines-plugin~Add Pipeline parameter'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('pipelines-plugin~No parameters are associated with this pipeline.');

  const nameLabel = t('pipelines-plugin~Name');
  const descriptionLabel = t('pipelines-plugin~Description');
  const defaultValueLabel = t('pipelines-plugin~Default value');

  return (
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-parameters"
        name={fieldName}
        addLabel={addLabel}
        headers={[
          {
            name: nameLabel,
            required: true,
          },
          descriptionLabel,
          defaultValueLabel,
        ]}
        emptyValues={{ name: '', description: '', default: '' }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
      >
        <InputField
          data-test="name"
          name="name"
          type={TextInputTypes.text}
          placeholder={nameLabel}
          isReadOnly={isReadOnly}
          aria-label={nameLabel}
        />
        <InputField
          data-test="description"
          name="description"
          type={TextInputTypes.text}
          placeholder={descriptionLabel}
          isReadOnly={isReadOnly}
          aria-label={descriptionLabel}
        />
        <InputField
          data-test="default"
          name="default"
          type={TextInputTypes.text}
          placeholder={defaultValueLabel}
          isReadOnly={isReadOnly}
          aria-label={defaultValueLabel}
        />
      </MultiColumnField>
    </div>
  );
};

export default PipelineParameters;
