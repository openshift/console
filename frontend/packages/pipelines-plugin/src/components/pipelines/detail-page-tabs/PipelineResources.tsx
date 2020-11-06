import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField } from '@console/shared';
import { pipelineResourceTypeSelections } from '../const';

type PipelineResourcesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineResources: React.FC<PipelineResourcesParam> = (props) => {
  const { t } = useTranslation();
  const {
    addLabel = t('pipelines-plugin~Add Pipeline Resource'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('pipelines-plugin~No resources are associated with this pipeline.');
  return (
    <MultiColumnField
      name={fieldName}
      addLabel={addLabel}
      headers={[t('pipelines-plugin~Name'), t('pipelines-plugin~Resource Type')]}
      emptyValues={{ name: '', type: '' }}
      emptyMessage={emptyMessage}
      isReadOnly={isReadOnly}
    >
      <InputField
        name="name"
        type={TextInputTypes.text}
        placeholder={t('pipelines-plugin~Name')}
        isReadOnly={isReadOnly}
      />
      <DropdownField
        name="type"
        items={pipelineResourceTypeSelections}
        fullWidth
        disabled={isReadOnly}
      />
    </MultiColumnField>
  );
};

export default PipelineResources;
