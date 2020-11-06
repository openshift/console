import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField } from '@console/shared';

type PipelineParametersProps = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineParameters: React.FC<PipelineParametersProps> = (props) => {
  const { t } = useTranslation();
  const {
    addLabel = t('pipelines-plugin~Add Pipeline Parameter'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('pipelines-plugin~No parameters are associated with this pipeline.');

  return (
    <MultiColumnField
      name={fieldName}
      addLabel={addLabel}
      headers={[
        t('pipelines-plugin~Name'),
        t('pipelines-plugin~Description'),
        t('pipelines-plugin~Default Value'),
      ]}
      emptyValues={{ name: '', description: '', default: '' }}
      emptyMessage={emptyMessage}
      isReadOnly={isReadOnly}
    >
      <InputField
        name="name"
        type={TextInputTypes.text}
        placeholder={t('pipelines-plugin~Name')}
        isReadOnly={isReadOnly}
      />
      <InputField
        name="description"
        type={TextInputTypes.text}
        placeholder={t('pipelines-plugin~Description')}
        isReadOnly={isReadOnly}
      />
      <InputField
        name="default"
        type={TextInputTypes.text}
        placeholder={t('pipelines-plugin~Default Value')}
        isReadOnly={isReadOnly}
      />
    </MultiColumnField>
  );
};

export default PipelineParameters;
