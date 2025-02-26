import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ClusterTaskModel } from '../../models';
import { TaskKind } from '../../types';
import WorkspaceDefinitionList from '../shared/workspaces/WorkspaceDefinitionList';

import './ClusterTaskDetails.scss';

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
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={task} />
        </div>
        <div className="col-sm-6 odc-cluster-task-details__status">
          <WorkspaceDefinitionList workspaces={task.spec.workspaces} />
        </div>
      </div>
    </PaneBody>
  );
};

export default ClusterTaskDetails;
