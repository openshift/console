import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ApprovalTaskKind } from '@console/pipelines-plugin/src/types';

export interface TaskDescriptionProps {
  obj: ApprovalTaskKind;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({ obj }) => {
  const { t } = useTranslation();
  if (!obj?.spec?.description || obj?.spec?.description?.length === 0) return null;

  return (
    <dl data-test-id="approval-task-description">
      <dt>{t('pipelines-plugin~Description')}</dt>
      <dd>{obj.spec?.description}</dd>
    </dl>
  );
};

export default TaskDescription;
