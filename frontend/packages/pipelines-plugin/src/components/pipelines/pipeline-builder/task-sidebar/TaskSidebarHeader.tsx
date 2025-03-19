import * as React from 'react';
import { Divider } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ActionsMenu } from '@console/internal/components/utils';
import PrimaryHeading from '@console/shared/src/components/heading/PrimaryHeading';
import { TaskKind } from '../../../../types';
import PipelineResourceRef from '../../../shared/common/PipelineResourceRef';
import TaskSidebarShortcuts from './TaskSidebarShortcuts';

import './TaskSidebarHeader.scss';

type TaskSidebarHeaderProps = {
  removeThisTask: () => void;
  taskResource: TaskKind;
};

const TaskSidebarHeader: React.FC<TaskSidebarHeaderProps> = ({ removeThisTask, taskResource }) => {
  const { t } = useTranslation();

  return (
    <div className="opp-task-sidebar-header">
      <div className="opp-task-sidebar-header__title">
        <PrimaryHeading>
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
        </PrimaryHeading>
      </div>
      <div className="opp-task-sidebar-header__shortcuts clearfix">
        <TaskSidebarShortcuts />
      </div>
      <Divider className="co-divider" />
    </div>
  );
};

export default TaskSidebarHeader;
