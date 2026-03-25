import { useMemo } from 'react';
import type { PopoverProps } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ShortcutTable, Shortcut } from '../shortcuts';
import { isMac } from '../shortcuts/Shortcut';

export const useShortcutPopover = (shortcutsPopoverProps?: Partial<PopoverProps>): PopoverProps => {
  const { t } = useTranslation('console-shared');

  return useMemo((): PopoverProps => {
    return {
      'aria-label': t('Shortcuts'),
      bodyContent: (
        <ShortcutTable>
          <Shortcut keyName="F1">{t('View all editor shortcuts')}</Shortcut>
          <Shortcut ctrl keyName="space">
            {t('Activate auto complete')}
          </Shortcut>
          <Shortcut ctrl shift={isMac} keyName="m">
            {t('Toggle Tab action between insert Tab character and move focus out of editor')}
          </Shortcut>
          <Shortcut ctrlCmd shift keyName="o">
            {t('View document outline')}
          </Shortcut>
          <Shortcut hover>{t('View property descriptions')}</Shortcut>
          <Shortcut ctrlCmd keyName="s">
            {t('Save')}
          </Shortcut>
        </ShortcutTable>
      ),
      maxWidth: '25rem',
      distance: 18,
      ...shortcutsPopoverProps,
    };
  }, [t, shortcutsPopoverProps]);
};
