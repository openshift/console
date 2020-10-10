import * as React from 'react';
import { Popover, Button } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { ShortcutTable, Shortcut } from '../shortcuts';
import { useTranslation } from 'react-i18next';

interface ShortcutsLinkProps {
  onHideShortcuts?: () => {};
}

const ShortcutsLink: React.FC<ShortcutsLinkProps> = ({ onHideShortcuts }) => {
  const { t } = useTranslation();
  return (
    <Popover
      aria-label={t('editor~Shortcuts')}
      bodyContent={
        <ShortcutTable>
          <Shortcut ctrl keyName="space">
            {t('editor~Activate auto complete')}
          </Shortcut>
          <Shortcut ctrlCmd shift keyName="o">
            {t('editor~View document outline')}
          </Shortcut>
          <Shortcut hover>{t('editor~View property descriptions')}</Shortcut>
          <Shortcut ctrlCmd keyName="s">
            {t('editor~Save')}
          </Shortcut>
        </ShortcutTable>
      }
      maxWidth="25rem"
      distance={18}
      onHide={onHideShortcuts}
    >
      <Button type="button" variant="link" isInline>
        <QuestionCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
        {t('editor~View shortcuts')}
      </Button>
    </Popover>
  );
};

export default ShortcutsLink;
