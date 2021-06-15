import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MultiColumnField } from '@console/shared';
import OptionalableWorkspace from './OptionalableWorkspace';

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
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-workspaces"
        name={fieldName}
        addLabel={addLabel}
        headers={[{ name: t('pipelines-plugin~Name'), required: true }]}
        emptyValues={{ name: '', optional: false }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
        complexFields={[true]}
      >
        <OptionalableWorkspace />
      </MultiColumnField>
    </div>
  );
};

export default PipelineWorkspaces;
