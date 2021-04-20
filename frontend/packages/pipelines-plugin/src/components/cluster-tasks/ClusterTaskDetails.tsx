import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
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
    <div className="co-m-pane__body">
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
    </div>
  );
};

export default ClusterTaskDetails;
