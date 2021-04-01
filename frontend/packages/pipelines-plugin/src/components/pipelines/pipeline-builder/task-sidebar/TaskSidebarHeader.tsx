import * as React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { referenceForModel } from '@console/internal/module/k8s';
import { ActionsMenu, ResourceIcon } from '@console/internal/components/utils';
import { getResourceModelFromTaskKind } from '../../../../utils/pipeline-augment';
import { TaskKind } from '../../../../types';

import './TaskSidebarHeader.scss';

type TaskSidebarHeaderProps = {
  removeThisTask: () => void;
  taskResource: TaskKind;
};

const TaskSidebarHeader: React.FC<TaskSidebarHeaderProps> = ({ removeThisTask, taskResource }) => {
  const { t } = useTranslation();

  let resourceKind: string = taskResource.kind;
  const model = getResourceModelFromTaskKind(resourceKind);
  if (model) {
    resourceKind = referenceForModel(model);
  }

  return (
    <>
      <div className="opp-task-sidebar-header">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon
              className={cx('co-m-resource-icon--lg', {
                'opp-task-sidebar-header__pipeline-color': !model,
              })}
              kind={resourceKind}
            />
            {taskResource.metadata.name}
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
