import * as React from 'react';
import { PopoverProps } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ShortcutTable, Shortcut } from '../shortcuts';
import { isMac } from '../shortcuts/Shortcut';

export const useShortcutLink = (onHideShortcuts?: () => {}): PopoverProps => {
  const { t } = useTranslation();

  return {
    'aria-label': t('console-shared~Shortcuts'),
    bodyContent: (
      <ShortcutTable>
        <Shortcut alt keyName="F1">
          {t('console-shared~Accessibility help')}
        </Shortcut>
        <Shortcut keyName="F1">{t('console-shared~View all editor shortcuts')}</Shortcut>
        <Shortcut ctrl keyName="space">
          {t('console-shared~Activate auto complete')}
        </Shortcut>
        <Shortcut ctrl shift={isMac} keyName="m">
          {t(
            'console-shared~Toggle Tab action between insert Tab character and move focus out of editor',
          )}
        </Shortcut>
        <Shortcut ctrlCmd shift keyName="o">
          {t('console-shared~View document outline')}
        </Shortcut>
        <Shortcut hover>{t('console-shared~View property descriptions')}</Shortcut>
        <Shortcut ctrlCmd keyName="s">
          {t('console-shared~Save')}
        </Shortcut>
      </ShortcutTable>
    ),
    maxWidth: '25rem',
    distance: 18,
    onHide: onHideShortcuts,
  };
};
