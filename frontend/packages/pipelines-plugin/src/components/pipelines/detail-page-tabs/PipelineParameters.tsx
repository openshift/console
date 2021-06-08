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
    addLabel = t('pipelines-plugin~Add Pipeline parameter'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('pipelines-plugin~No parameters are associated with this pipeline.');

  return (
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-parameters"
        name={fieldName}
        addLabel={addLabel}
        headers={[
          t('pipelines-plugin~Name'),
          t('pipelines-plugin~Description'),
          t('pipelines-plugin~Default value'),
        ]}
        emptyValues={{ name: '', description: '', default: '' }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
      >
        <InputField
          data-test="name"
          name="name"
          type={TextInputTypes.text}
          placeholder={t('pipelines-plugin~Name')}
          isReadOnly={isReadOnly}
        />
        <InputField
          data-test="description"
          name="description"
          type={TextInputTypes.text}
          placeholder={t('pipelines-plugin~Description')}
          isReadOnly={isReadOnly}
        />
        <InputField
          data-test="default"
          name="default"
          type={TextInputTypes.text}
          placeholder={t('pipelines-plugin~Default value')}
          isReadOnly={isReadOnly}
        />
      </MultiColumnField>
    </div>
  );
};

export default PipelineParameters;
