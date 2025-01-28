import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import { useTranslation } from 'react-i18next';
import { Shortcut, ShortcutTable } from '@console/shared';

const TaskSidebarShortcuts: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Popover
      aria-label={t('pipelines-plugin~View shortcuts')}
      bodyContent={
        <ShortcutTable>
          <Shortcut ctrl keyName="space">
            {t('pipelines-plugin~Activate auto complete')}
          </Shortcut>
        </ShortcutTable>
      }
      maxWidth="25rem"
      distance={18}
    >
      <Button
        icon={
          <QuestionCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
        }
        type="button"
        variant="link"
        isInline
      >
        {t('pipelines-plugin~View shortcuts')}
      </Button>
    </Popover>
  );
};

export default TaskSidebarShortcuts;
