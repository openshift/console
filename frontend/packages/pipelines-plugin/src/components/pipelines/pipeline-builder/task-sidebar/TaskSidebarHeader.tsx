import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionsMenu } from '@console/internal/components/utils';
import { BasePageHeading } from '@console/internal/components/utils/headings';
import { TaskKind } from '../../../../types';
import PipelineResourceRef from '../../../shared/common/PipelineResourceRef';
import TaskSidebarShortcuts from './TaskSidebarShortcuts';

type TaskSidebarHeaderProps = {
  removeThisTask: () => void;
  taskResource: TaskKind;
};

const TaskSidebarHeader: React.FC<TaskSidebarHeaderProps> = ({ removeThisTask, taskResource }) => {
  const { t } = useTranslation();

  return (
    <BasePageHeading
      hideFavoriteButton
      title={
        <PipelineResourceRef
          resourceKind={taskResource.kind}
          resourceName={taskResource.metadata.name}
          largeIcon
          disableLink
        />
      }
      primaryAction={
        <ActionsMenu
          actions={[
            {
              label: t('pipelines-plugin~Remove task'),
              callback: () => removeThisTask(),
            },
          ]}
        />
      }
      helpText={<TaskSidebarShortcuts />}
    />
  );
};

export default TaskSidebarHeader;
