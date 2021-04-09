import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, GridItem } from '@patternfly/react-core';
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
    <Grid span={6}>
      <GridItem>
        <MultiColumnField
          name={fieldName}
          addLabel={addLabel}
          headers={[t('pipelines-plugin~Name')]}
          emptyValues={{ name: '', optional: false }}
          emptyMessage={emptyMessage}
          isReadOnly={isReadOnly}
          complexFields={[true]}
        >
          <OptionalableWorkspace />
        </MultiColumnField>
      </GridItem>
    </Grid>
  );
};

export default PipelineWorkspaces;
