import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ClusterTaskModel } from '../../models';
import { TaskKind } from '../../types';
import WorkspaceDefinitionList from '../shared/workspaces/WorkspaceDefinitionList';

export interface ClusterTaskDetailsProps {
  obj: TaskKind;
}

const ClusterTaskDetails: React.FC<ClusterTaskDetailsProps> = ({ obj: task }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading
        text={t('pipelines-plugin~{{clusterTaskLabel}} details', {
          clusterTaskLabel: t(ClusterTaskModel.labelKey),
        })}
      />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={task} />
        </GridItem>
        <GridItem sm={6} className="odc-cluster-task-details__status">
          <WorkspaceDefinitionList workspaces={task.spec.workspaces} />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default ClusterTaskDetails;
