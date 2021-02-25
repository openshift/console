import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField } from '@console/shared';

type PipelineWorkspacesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineWorkspaces: React.FC<PipelineWorkspacesParam> = (props) => {
  const { t } = useTranslation();
  const {
    addLabel = t('pipelines-plugin~Add Pipeline workspace'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('pipelines-plugin~No workspaces are associated with this pipeline.');
  return (
    <MultiColumnField
      name={fieldName}
      addLabel={addLabel}
      headers={[t('pipelines-plugin~Name')]}
      emptyValues={{ name: '' }}
      emptyMessage={emptyMessage}
      isReadOnly={isReadOnly}
    >
      <InputField
        name="name"
        type={TextInputTypes.text}
        placeholder={t('pipelines-plugin~Name')}
        isReadOnly={isReadOnly}
      />
    </MultiColumnField>
  );
};

export default PipelineWorkspaces;
