import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionsMenu, CloseButton } from '@console/internal/components/utils';
import { TaskKind } from '../../../../types';
import PipelineResourceRef from '../../../shared/common/PipelineResourceRef';
import TaskSidebarShortcuts from './TaskSidebarShortcuts';

import './TaskSidebarHeader.scss';

type TaskSidebarHeaderProps = {
  onClose: () => void;
  removeThisTask: () => void;
  taskResource: TaskKind;
};

const TaskSidebarHeader: React.FC<TaskSidebarHeaderProps> = ({
  onClose,
  removeThisTask,
  taskResource,
}) => {
  const { t } = useTranslation();

  return (
    <div className="opp-task-sidebar-header">
      <div className="co-sidebar-dismiss clearfix">
        <CloseButton onClick={onClose} />
      </div>
      <div className="opp-task-sidebar-header__title">
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
                  label: t('pipelines-plugin~Remove task'),
                  callback: () => removeThisTask(),
                },
              ]}
            />
          </div>
        </h1>
      </div>
      <div className="opp-task-sidebar-header__shortcuts clearfix">
        <TaskSidebarShortcuts />
      </div>
      <hr />
    </div>
  );
};

export default TaskSidebarHeader;
