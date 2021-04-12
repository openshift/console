import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionsMenu } from '@console/internal/components/utils';
import { TaskKind } from '../../../../types';
import PipelineResourceRef from '../../../shared/common/PipelineResourceRef';

import './TaskSidebarHeader.scss';

type TaskSidebarHeaderProps = {
  removeThisTask: () => void;
  taskResource: TaskKind;
};

const TaskSidebarHeader: React.FC<TaskSidebarHeaderProps> = ({ removeThisTask, taskResource }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="opp-task-sidebar-header">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <PipelineResourceRef
              resourceKind={taskResource.kind}
              resourceName={taskResource.metadata.name}
              largeIcon
              disableLink
            />
          </div>
          <div className="co-actions">
            <ActionsMenu
              actions={[
                {
                  label: t('pipelines-plugin~Remove Task'),
                  callback: () => removeThisTask(),
                },
              ]}
            />
          </div>
        </h1>
      </div>
      <hr />
    </>
  );
};

export default TaskSidebarHeader;
